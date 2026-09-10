import { dbError, getDb, landingTables } from "./db.js";
import { hasSupabase } from "./env.js";

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
    .eq("audience", HOMEOWNER_AUDIENCE);

  if (error) throw new Error(dbError(error));
  return count || 0;
}

export async function registerHousehold(body) {
  if (!hasSupabase()) {
    const error = new Error("Registration is temporarily unavailable.");
    error.status = 503;
    throw error;
  }

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
  const row = {
    audience: HOMEOWNER_AUDIENCE,
    email,
    phone: keepPhone ? phone : null,
    market,
    buying_timeline: timeline,
    sms_consent: keepPhone,
    sms_consent_at: keepPhone ? new Date().toISOString() : null,
    utm_source: field(body.utm_source, 120) || null,
    utm_medium: field(body.utm_medium, 120) || null,
    utm_campaign: field(body.utm_campaign, 120) || null,
    referrer: field(body.referrer, 500) || null,
  };

  const db = getDb();
  const { data, error } = await db
    .from(landingTables.waitlist)
    .insert(row)
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      const duplicate = new Error(
        "This email is already on the founding household list. Your rate is locked — we'll be in touch before launch.",
      );
      duplicate.status = 409;
      throw duplicate;
    }
    const failed = new Error("We couldn't complete your registration.");
    failed.status = 500;
    throw failed;
  }

  return { id: data.id };
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
    createdAt: row.created_at,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    referrer: row.referrer,
  };
}

export function computeHouseholdKpis(rows) {
  const signups = rows.length;
  const withPhone = rows.filter((row) => row.phone).length;
  const smsOptIn = rows.filter((row) => row.sms_consent).length;

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
