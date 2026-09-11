import { createClient } from "@supabase/supabase-js";

export const LANDING_SCHEMA = "landing";

export const landingTables = {
  pricing: "pricing",
  reservations: "reservations",
  stripeEvents: "stripe_events",
  waitlist: "waitlist",
  emailTemplates: "email_templates",
  emailSends: "email_sends",
};

let client;

export function getDb() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }

  if (!client) {
    client = createClient(url, key, {
      db: { schema: LANDING_SCHEMA },
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return client;
}

export function dbError(error, fallback = "Database request failed.") {
  return error?.message || fallback;
}
