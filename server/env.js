export function optional(name, fallback = "") {
  return process.env[name] || fallback;
}

export function hasSupabase() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function hasStripe() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function isStripeTestMode() {
  return (process.env.STRIPE_SECRET_KEY || "").startsWith("sk_test_");
}

export function appUrl(request) {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  const host = request.headers.get("host") || "localhost:5173";
  const proto = request.headers.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

export function stripeDashboardBase() {
  return isStripeTestMode()
    ? "https://dashboard.stripe.com/test"
    : "https://dashboard.stripe.com";
}
