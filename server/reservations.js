import { getDb, dbError, landingTables } from "./db.js";
import { hasStripe, stripeDashboardBase } from "./env.js";
import {
  FOUNDING_CAPACITY,
  PACKAGES,
  isPackageKey,
  isPaidCheckoutStatus,
  isRefundEligible,
} from "./packages.js";
import { listPricingPlans } from "./pricing.js";
import { getStripe } from "./stripe.js";

function normalizeStatus(status) {
  return status === "refunded" ? "canceled" : status;
}

function serializeReservation(row) {
  const catalog = PACKAGES[row.package] || {};
  const paymentStatus = normalizeStatus(row.payment_status);
  const refundEligible = isRefundEligible({ ...row, payment_status: paymentStatus });

  return {
    id: row.id,
    agentName: row.agent_name || "Unknown agent",
    email: row.email,
    phone: row.phone,
    package: row.package,
    planName: catalog.displayName || row.package,
    tagline: catalog.tagline || "",
    quantityReserved: row.quantity_reserved,
    quantityUsed: row.quantity_used,
    amountPaid: row.amount_paid,
    paymentStatus,
    stripeCustomerId: row.stripe_customer_id,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    purchasedAt: row.purchased_at,
    firstDocumentsReceivedAt: row.first_documents_received_at,
    refundedAt: row.refunded_at,
    internalNotes: row.internal_notes || "",
    refundEligible,
    canRefund: paymentStatus === "paid",
    stripeUrl: stripeUrlFor(row),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function stripeUrlFor(row) {
  const base = stripeDashboardBase();
  if (row.stripe_payment_intent_id) {
    return `${base}/payments/${row.stripe_payment_intent_id}`;
  }
  if (row.stripe_customer_id) {
    return `${base}/customers/${row.stripe_customer_id}`;
  }
  if (row.stripe_checkout_session_id) {
    return `${base}/checkout/sessions/${row.stripe_checkout_session_id}`;
  }
  return base;
}

function customerId(value) {
  if (typeof value === "string") return value;
  return value?.id || null;
}

function paymentIntentId(value) {
  if (typeof value === "string") return value;
  return value?.id || null;
}

function customerPhone(session) {
  return (
    session.customer_details?.phone ||
    session.metadata?.customer_phone ||
    (typeof session.customer === "object" ? session.customer?.phone : null) ||
    null
  );
}

function lineItemPriceId(item) {
  if (!item) return null;
  if (typeof item.price === "string") return item.price;
  return item.price?.id || null;
}

export function paidStatusFromSession(session) {
  return isPaidCheckoutStatus(session?.payment_status) ? "paid" : "pending";
}

export function computeKpis(rows) {
  const signups = rows.length;
  const paid = rows.filter((row) => normalizeStatus(row.payment_status) === "paid");
  const reserved = paid.reduce((sum, row) => sum + Number(row.quantity_reserved || 0), 0);
  const revenueCents = paid.reduce((sum, row) => sum + Number(row.amount_paid || 0), 0);
  const remaining = Math.max(FOUNDING_CAPACITY - reserved, 0);

  return {
    waitlistSignups: signups,
    paidAgents: paid.length,
    revenueCents,
    reservedTransactions: reserved,
    remainingTransactions: remaining,
    capacity: FOUNDING_CAPACITY,
    reservedPercent: FOUNDING_CAPACITY
      ? Math.round((reserved / FOUNDING_CAPACITY) * 100)
      : 0,
  };
}

export async function listReservations({ q = "", plan = "", status = "" } = {}) {
  const db = getDb();
  const { data, error } = await db
    .from(landingTables.reservations)
    .select("*")
    .is("deleted_at", null)
    .order("purchased_at", { ascending: false, nullsFirst: false });
  if (error) throw new Error(dbError(error));

  const all = data || [];
  const needle = q.trim().toLowerCase();
  const wantedStatus = normalizeStatus(status);
  const rows = all.filter((row) => {
    if (plan && plan !== "all" && row.package !== plan) return false;
    if (wantedStatus && wantedStatus !== "all" && normalizeStatus(row.payment_status) !== wantedStatus) {
      return false;
    }
    if (!needle) return true;
    return (
      String(row.agent_name || "").toLowerCase().includes(needle) ||
      String(row.email || "").toLowerCase().includes(needle) ||
      String(row.phone || "").toLowerCase().includes(needle)
    );
  });

  return {
    kpis: computeKpis(all),
    users: rows.map(serializeReservation),
  };
}

export async function getReservation(id) {
  const row = await getReservationRow(id);
  return row ? serializeReservation(row) : null;
}

async function getReservationRow(id, { includeDeleted = false } = {}) {
  const db = getDb();
  const { data, error } = await db
    .from(landingTables.reservations)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(dbError(error));
  if (!data || (!includeDeleted && data.deleted_at)) return null;
  return data;
}

export async function updateNotes(id, notes) {
  const db = getDb();
  const { data, error } = await db
    .from(landingTables.reservations)
    .update({ internal_notes: notes ?? "" })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(dbError(error));
  return serializeReservation(data);
}

export async function markDocsReceived(id) {
  const existing = await getReservationRow(id);
  if (!existing) return null;
  if (existing.first_documents_received_at) return serializeReservation(existing);

  const db = getDb();
  const { data, error } = await db
    .from(landingTables.reservations)
    .update({ first_documents_received_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw new Error(dbError(error));
  return serializeReservation(data);
}

async function priceIdToPackageMap() {
  const plans = await listPricingPlans();
  const map = new Map();
  for (const plan of plans) {
    if (plan.stripePriceId) map.set(plan.stripePriceId, plan.packageKey);
  }
  return map;
}

export async function resolvePackageKey(session, priceMap) {
  if (isPackageKey(session?.metadata?.package)) return session.metadata.package;

  let items = session?.line_items?.data;
  if (!items?.length && session?.id && hasStripe()) {
    const stripe = getStripe();
    const listed = await stripe.checkout.sessions.listLineItems(session.id, { limit: 10 });
    items = listed.data;
  }

  const priceId = lineItemPriceId(items?.[0]);
  if (!priceId) return null;

  const map = priceMap || (await priceIdToPackageMap());
  return map.get(priceId) || null;
}

export async function upsertFromCheckoutSession(session, paymentStatus) {
  const packageKey = await resolvePackageKey(session);
  const catalog = PACKAGES[packageKey];
  const email =
    session.customer_details?.email ||
    session.customer_email ||
    session.metadata?.customer_email;
  if (!email || !catalog) return null;

  const requestedStatus = paymentStatus === "canceled" || paymentStatus === "refunded"
    ? "canceled"
    : paymentStatus;
  const quantity = Number(session.metadata?.transaction_count) || catalog.transactionCount;
  const purchasedAt =
    requestedStatus === "paid" || requestedStatus === "canceled"
      ? new Date((session.created || Date.now() / 1000) * 1000).toISOString()
      : null;

  const row = {
    agent_name: session.customer_details?.name || session.metadata?.customer_name || null,
    email,
    phone: customerPhone(session),
    package: packageKey,
    quantity_reserved: quantity,
    amount_paid: session.amount_total == null ? catalog.fallbackPriceCents : session.amount_total,
    payment_status: requestedStatus,
    stripe_customer_id: customerId(session.customer),
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId(session.payment_intent),
    purchased_at: purchasedAt,
    utm_source: session.metadata?.utm_source || null,
    utm_medium: session.metadata?.utm_medium || null,
    utm_campaign: session.metadata?.utm_campaign || null,
    referrer: session.metadata?.referrer || null,
  };

  const db = getDb();
  const { data: existing, error: findError } = await db
    .from(landingTables.reservations)
    .select("id, payment_status, refunded_at, purchased_at, deleted_at")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();
  if (findError) throw new Error(dbError(findError));

  if (existing?.deleted_at) return null;

  if (existing) {
    const alreadyCanceled = normalizeStatus(existing.payment_status) === "canceled" || existing.refunded_at;
    const nextStatus = alreadyCanceled ? "canceled" : requestedStatus;
    const { error } = await db
      .from(landingTables.reservations)
      .update({
        ...row,
        payment_status: nextStatus,
        purchased_at: existing.purchased_at || row.purchased_at,
        refunded_at: alreadyCanceled ? existing.refunded_at || new Date().toISOString() : existing.refunded_at,
      })
      .eq("id", existing.id);
    if (error) throw new Error(dbError(error));
    return existing.id;
  }

  const { error } = await db.from(landingTables.reservations).insert(row);
  if (error) throw new Error(dbError(error));
  return true;
}

export async function confirmCheckoutSession(sessionId) {
  const id = String(sessionId || "").trim();
  if (!id.startsWith("cs_")) {
    const error = new Error("A valid Checkout session is required.");
    error.status = 400;
    throw error;
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(id, {
    expand: ["line_items", "customer"],
  });

  if (session.status !== "complete" || !isPaidCheckoutStatus(session.payment_status)) {
    return null;
  }
  return upsertFromCheckoutSession(session, "paid");
}

async function knownCheckoutSessionIds() {
  const db = getDb();
  const { data, error } = await db
    .from(landingTables.reservations)
    .select("stripe_checkout_session_id")
    .not("stripe_checkout_session_id", "is", null);
  if (error) throw new Error(dbError(error));
  return new Set((data || []).map((row) => row.stripe_checkout_session_id));
}

export async function syncPaidCheckoutSessions() {
  if (!hasStripe()) return { imported: 0 };

  const stripe = getStripe();
  const [priceMap, knownIds] = await Promise.all([priceIdToPackageMap(), knownCheckoutSessionIds()]);
  let imported = 0;
  let startingAfter;

  do {
    const page = await stripe.checkout.sessions.list({
      limit: 100,
      status: "complete",
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    for (const session of page.data) {
      if (!isPaidCheckoutStatus(session.payment_status)) continue;
      if (knownIds.has(session.id)) continue;

      const packageKey = await resolvePackageKey(session, priceMap);
      if (!packageKey) continue;
      const saved = await upsertFromCheckoutSession(
        { ...session, metadata: { ...session.metadata, package: packageKey } },
        "paid",
      );
      if (saved) {
        imported += 1;
        knownIds.add(session.id);
      }
    }

    startingAfter = page.has_more ? page.data[page.data.length - 1]?.id : null;
  } while (startingAfter);

  return { imported };
}

async function setCanceled(existing) {
  const db = getDb();
  const { data, error } = await db
    .from(landingTables.reservations)
    .update({
      payment_status: "canceled",
      refunded_at: existing.refunded_at || new Date().toISOString(),
    })
    .eq("id", existing.id)
    .select("*")
    .single();
  if (error) throw new Error(dbError(error));
  return serializeReservation(data);
}

export async function markCanceled({ paymentIntentId, checkoutSessionId }) {
  const db = getDb();
  let query = db.from(landingTables.reservations).select("*");

  if (paymentIntentId) {
    query = query.eq("stripe_payment_intent_id", paymentIntentId);
  } else if (checkoutSessionId) {
    query = query.eq("stripe_checkout_session_id", checkoutSessionId);
  } else {
    return null;
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(dbError(error));
  if (!data) return null;
  if (normalizeStatus(data.payment_status) === "canceled") return serializeReservation(data);
  return setCanceled(data);
}

export async function refundReservation(id) {
  const existing = await getReservationRow(id);
  if (!existing) return null;
  if (normalizeStatus(existing.payment_status) === "canceled") {
    return serializeReservation(existing);
  }

  const intentId = existing.stripe_payment_intent_id;
  const amount = Number(existing.amount_paid || 0);
  if (intentId && amount > 0) {
    try {
      await getStripe().refunds.create({
        payment_intent: intentId,
        reason: "requested_by_customer",
      });
    } catch (error) {
      const code = error?.code || error?.raw?.code;
      const message = String(error?.message || "");
      if (code !== "charge_already_refunded" && !/already been refunded/i.test(message)) {
        throw error;
      }
    }
  }

  return setCanceled(existing);
}

export const markRefunded = markCanceled;
