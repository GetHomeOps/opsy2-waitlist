import { getDb, dbError, landingTables } from "./db.js";
import { FOUNDING_CAPACITY, PACKAGES, isRefundEligible } from "./packages.js";
import { stripeDashboardBase } from "./env.js";

function serializeReservation(row) {
  const catalog = PACKAGES[row.package] || {};
  const refundEligible = isRefundEligible(row);

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
    paymentStatus: row.payment_status,
    stripeCustomerId: row.stripe_customer_id,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    purchasedAt: row.purchased_at,
    firstDocumentsReceivedAt: row.first_documents_received_at,
    refundedAt: row.refunded_at,
    internalNotes: row.internal_notes || "",
    refundEligible,
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

export function computeKpis(rows) {
  const signups = rows.length;
  const paid = rows.filter((row) => row.payment_status === "paid");
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
    .order("purchased_at", { ascending: false, nullsFirst: false });
  if (error) throw new Error(dbError(error));

  const all = data || [];
  const needle = q.trim().toLowerCase();
  const rows = all.filter((row) => {
    if (plan && plan !== "all" && row.package !== plan) return false;
    if (status && status !== "all" && row.payment_status !== status) return false;
    if (!needle) return true;
    return (
      String(row.agent_name || "").toLowerCase().includes(needle) ||
      String(row.email || "").toLowerCase().includes(needle)
    );
  });

  return {
    kpis: computeKpis(all),
    users: rows.map(serializeReservation),
  };
}

export async function getReservation(id) {
  const db = getDb();
  const { data, error } = await db
    .from(landingTables.reservations)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(dbError(error));
  return data ? serializeReservation(data) : null;
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
  const existing = await getReservation(id);
  if (!existing) return null;
  if (existing.firstDocumentsReceivedAt) return existing;

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

export async function upsertFromCheckoutSession(session, paymentStatus) {
  const packageKey = session.metadata?.package;
  const catalog = PACKAGES[packageKey];
  const email =
    session.customer_details?.email ||
    session.customer_email ||
    session.metadata?.customer_email;
  if (!email || !catalog) return null;

  const quantity = Number(session.metadata?.transaction_count) || catalog.transactionCount;
  const purchasedAt =
    paymentStatus === "paid"
      ? new Date((session.created || Date.now() / 1000) * 1000).toISOString()
      : null;

  const row = {
    agent_name: session.customer_details?.name || session.metadata?.customer_name || null,
    email,
    phone: session.customer_details?.phone || session.metadata?.customer_phone || null,
    package: packageKey,
    quantity_reserved: quantity,
    amount_paid: session.amount_total ?? catalog.fallbackPriceCents,
    payment_status: paymentStatus,
    stripe_customer_id: session.customer || null,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id || null,
    purchased_at: purchasedAt,
    utm_source: session.metadata?.utm_source || null,
    utm_medium: session.metadata?.utm_medium || null,
    utm_campaign: session.metadata?.utm_campaign || null,
    referrer: session.metadata?.referrer || null,
  };

  const db = getDb();
  const { data: existing, error: findError } = await db
    .from(landingTables.reservations)
    .select("id, internal_notes, first_documents_received_at, refunded_at")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();
  if (findError) throw new Error(dbError(findError));

  if (existing) {
    const { error } = await db
      .from(landingTables.reservations)
      .update({
        ...row,
        refunded_at: paymentStatus === "refunded" ? existing.refunded_at || new Date().toISOString() : existing.refunded_at,
      })
      .eq("id", existing.id);
    if (error) throw new Error(dbError(error));
    return existing.id;
  }

  const { error } = await db.from(landingTables.reservations).insert(row);
  if (error) throw new Error(dbError(error));
  return true;
}

export async function markRefunded({ paymentIntentId, checkoutSessionId }) {
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

  const { error: updateError } = await db
    .from(landingTables.reservations)
    .update({
      payment_status: "refunded",
      refunded_at: data.refunded_at || new Date().toISOString(),
    })
    .eq("id", data.id);
  if (updateError) throw new Error(dbError(updateError));
  return data.id;
}
