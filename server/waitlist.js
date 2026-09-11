import { dbError, getDb, landingTables } from "./db.js";
import { firstNameFrom, homeownerVars, sendRegistrationEmail } from "./email.js";
import { hasStripe, hasSupabase } from "./env.js";
import { PACKAGES, isPaidCheckoutStatus } from "./packages.js";
import { getPricingByKey } from "./pricing.js";
import { getStripe } from "./stripe.js";

export const FOUNDING_HOUSEHOLD_CAP = 250;
export const HOMEOWNER_AUDIENCE = "homeowner";

export const BUYING_TIMELINES = {
  in_contract: "In contract",
  within_a_year: "Within a year",
  already_home: "Already home",
};

function field(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function countHouseholds() {
  if (!hasSupabase()) {
    const error = new Error("Count unavailable.");
    error.status = 503;
    throw error;
  }

  const db = getDb();
  const { count, error } = await db
    .from(landingTables.waitlist)
    .select("id", { count: "exact", head: true })
    .eq("audience", HOMEOWNER_AUDIENCE)
    .eq("payment_status", "paid");

  if (error) throw new Error(dbError(error));
  return count || 0;
}

function householdDetails(body) {
  const email = field(body.email, 254).toLowerCase();
  const phone = field(body.phone, 40);
  const market = field(body.market, 120);
  const timeline = field(body.buyingTimeline || body.buying_timeline, 40);
  const smsConsent = Boolean(body.smsConsent ?? body.sms_consent);

  if (!isValidEmail(email)) {
    const error = new Error("Please enter a valid email.");
    error.status = 400;
    throw error;
  }
  if (!market) {
    const error = new Error("Please enter your market or city.");
    error.status = 400;
    throw error;
  }
  if (!BUYING_TIMELINES[timeline]) {
    const error = new Error("Please choose a buying timeline.");
    error.status = 400;
    throw error;
  }

  const digits = phone.replace(/\D/g, "");
  if (phone && digits.length < 10) {
    const error = new Error("Please enter a valid mobile number.");
    error.status = 400;
    throw error;
  }
  if (phone && !smsConsent) {
    const error = new Error("Please confirm SMS consent to save your mobile number.");
    error.status = 400;
    throw error;
  }

  const keepPhone = Boolean(phone && smsConsent);
  return {
    email,
    phone: keepPhone ? phone : "",
    market,
    timeline,
    smsConsent: keepPhone,
    utmSource: field(body.utm_source, 120),
    utmMedium: field(body.utm_medium, 120),
    utmCampaign: field(body.utm_campaign, 120),
    referrer: field(body.referrer, 500),
  };
}

function customerId(value) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id || null;
}

function paymentIntentId(value) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id || null;
}

export async function startHouseholdCheckout(body, origin) {
  if (!hasSupabase() || !hasStripe()) {
    const error = new Error("Checkout is temporarily unavailable.");
    error.status = 503;
    throw error;
  }

  const details = householdDetails(body);
  const db = getDb();
  const { data: existing, error: findError } = await db
    .from(landingTables.waitlist)
    .select("id, payment_status")
    .eq("audience", HOMEOWNER_AUDIENCE)
    .eq("email", details.email)
    .maybeSingle();
  if (findError) throw new Error(dbError(findError));
  if (existing?.payment_status === "paid") {
    const duplicate = new Error(
      "This email is already on the founding household list. Your rate is locked — we'll be in touch before launch.",
    );
    duplicate.status = 409;
    throw duplicate;
  }

  const plan = await getPricingByKey("household");
  if (!plan?.stripePriceId) {
    const error = new Error("The founding household plan is not connected to Stripe yet.");
    error.status = 409;
    throw error;
  }

  const metadata = {
    product: "founding_household",
    package: "household",
    customer_email: details.email,
    customer_phone: details.phone,
    market: details.market,
    buying_timeline: details.timeline,
    sms_consent: details.smsConsent ? "true" : "false",
  };
  if (details.utmSource) metadata.utm_source = details.utmSource;
  if (details.utmMedium) metadata.utm_medium = details.utmMedium;
  if (details.utmCampaign) metadata.utm_campaign = details.utmCampaign;
  if (details.referrer) metadata.referrer = details.referrer.slice(0, 500);

  const stripe = getStripe();
  const name = firstNameFrom({ email: details.email });
  const customers = await stripe.customers.list({ email: details.email, limit: 1 });
  const customerPayload = {
    name,
    email: details.email,
    phone: details.phone || undefined,
    metadata,
  };
  const customer = customers.data[0]
    ? await stripe.customers.update(customers.data[0].id, customerPayload)
    : await stripe.customers.create(customerPayload);

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customer.id,
    customer_update: { name: "auto", address: "auto" },
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${origin}/homeowners/reserved?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/homeowners#waitlist`,
    metadata,
    payment_intent_data: { metadata },
    billing_address_collection: "auto",
    allow_promotion_codes: true,
  });

  return { url: session.url };
}

export async function upsertPaidHousehold(session, { notify = true } = {}) {
  if (session?.metadata?.product !== "founding_household") return null;

  const email = field(
    session.customer_details?.email || session.customer_email || session.metadata?.customer_email,
    254,
  ).toLowerCase();
  if (!isValidEmail(email)) return null;

  const phone = field(session.metadata?.customer_phone || session.customer_details?.phone, 40);
  const market = field(session.metadata?.market, 120) || "—";
  const timeline = field(session.metadata?.buying_timeline, 40);
  const smsConsent = session.metadata?.sms_consent === "true";
  const catalog = PACKAGES.household;
  const amountPaid =
    session.amount_total == null ? catalog.fallbackPriceCents : session.amount_total;
  const purchasedAt = new Date((session.created || Date.now() / 1000) * 1000).toISOString();
  const row = {
    audience: HOMEOWNER_AUDIENCE,
    email,
    phone: phone || null,
    market,
    buying_timeline: BUYING_TIMELINES[timeline] ? timeline : null,
    sms_consent: smsConsent,
    sms_consent_at: smsConsent ? purchasedAt : null,
    payment_status: "paid",
    amount_paid: amountPaid,
    stripe_customer_id: customerId(session.customer),
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: paymentIntentId(session.payment_intent),
    purchased_at: purchasedAt,
    utm_source: field(session.metadata?.utm_source, 120) || null,
    utm_medium: field(session.metadata?.utm_medium, 120) || null,
    utm_campaign: field(session.metadata?.utm_campaign, 120) || null,
    referrer: field(session.metadata?.referrer, 500) || null,
  };

  const db = getDb();
  const { data: bySession, error: sessionError } = await db
    .from(landingTables.waitlist)
    .select("id, payment_status")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();
  if (sessionError) throw new Error(dbError(sessionError));

  const { data: byEmail, error: emailError } = await db
    .from(landingTables.waitlist)
    .select("id, payment_status")
    .eq("audience", HOMEOWNER_AUDIENCE)
    .eq("email", email)
    .maybeSingle();
  if (emailError) throw new Error(dbError(emailError));

  const existing = bySession || byEmail;
  const becamePaid = existing?.payment_status !== "paid";

  if (existing) {
    const { error } = await db.from(landingTables.waitlist).update(row).eq("id", existing.id);
    if (error) throw new Error(dbError(error));
    if (notify && becamePaid) {
      await sendRegistrationEmail({
        audience: HOMEOWNER_AUDIENCE,
        to: email,
        waitlistId: existing.id,
        vars: homeownerVars(row),
      });
    }
    return existing.id;
  }

  const { data, error } = await db.from(landingTables.waitlist).insert(row).select("id").single();
  if (error) {
    if (error.code === "23505") return byEmail?.id || null;
    throw new Error(dbError(error));
  }
  if (notify) {
    await sendRegistrationEmail({
      audience: HOMEOWNER_AUDIENCE,
      to: email,
      waitlistId: data.id,
      vars: homeownerVars(row),
    });
  }
  return data.id;
}

export async function confirmHouseholdSession(sessionId) {
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
  if (session.metadata?.product !== "founding_household") return null;
  if (session.status !== "complete" || !isPaidCheckoutStatus(session.payment_status)) {
    return null;
  }
  return upsertPaidHousehold(session);
}

function serializeHousehold(row) {
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    market: row.market,
    buyingTimeline: row.buying_timeline,
    buyingTimelineLabel: BUYING_TIMELINES[row.buying_timeline] || "—",
    smsConsent: Boolean(row.sms_consent),
    smsConsentAt: row.sms_consent_at,
    paymentStatus: row.payment_status || "paid",
    amountPaid: row.amount_paid,
    purchasedAt: row.purchased_at,
    createdAt: row.created_at,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    referrer: row.referrer,
  };
}

export function computeHouseholdKpis(rows) {
  const paid = rows.filter((row) => (row.payment_status || "paid") === "paid");
  const signups = paid.length;
  const withPhone = paid.filter((row) => row.phone).length;
  const smsOptIn = paid.filter((row) => row.sms_consent).length;

  return {
    waitlistSignups: signups,
    remaining: Math.max(FOUNDING_HOUSEHOLD_CAP - signups, 0),
    capacity: FOUNDING_HOUSEHOLD_CAP,
    withPhone,
    smsOptIn,
    reservedPercent: FOUNDING_HOUSEHOLD_CAP
      ? Math.round((signups / FOUNDING_HOUSEHOLD_CAP) * 100)
      : 0,
  };
}

export async function listHouseholds({ q = "", timeline = "" } = {}) {
  if (!hasSupabase()) {
    const error = new Error("Homeowners are temporarily unavailable.");
    error.status = 503;
    throw error;
  }

  const db = getDb();
  const { data, error } = await db
    .from(landingTables.waitlist)
    .select("*")
    .eq("audience", HOMEOWNER_AUDIENCE)
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false });

  if (error) throw new Error(dbError(error));

  const all = data || [];
  const needle = q.trim().toLowerCase();
  const wantedTimeline = String(timeline || "").trim();
  const rows = all.filter((row) => {
    if (wantedTimeline && wantedTimeline !== "all" && row.buying_timeline !== wantedTimeline) {
      return false;
    }
    if (!needle) return true;
    return (
      String(row.email || "").toLowerCase().includes(needle) ||
      String(row.phone || "").toLowerCase().includes(needle) ||
      String(row.market || "").toLowerCase().includes(needle)
    );
  });

  return {
    kpis: computeHouseholdKpis(all),
    users: rows.map(serializeHousehold),
  };
}
