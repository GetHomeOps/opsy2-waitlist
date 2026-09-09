import { Hono } from "hono";
import {
  clearSessionCookie,
  createSessionToken,
  getSession,
  requireAdmin,
  setSessionCookie,
  verifyAdminPassword,
} from "./auth.js";
import { appUrl, hasStripe, hasSupabase } from "./env.js";
import { isPackageKey, PACKAGE_KEYS, PACKAGES } from "./packages.js";
import {
  connectStripePrice,
  getPricingByKey,
  getPublicPricing,
  listPricingPlans,
  listStripeOneTimePrices,
  syncConnectedPrices,
} from "./pricing.js";
import {
  getReservation,
  listReservations,
  markDocsReceived,
  updateNotes,
} from "./reservations.js";
import { getStripe } from "./stripe.js";
import { processStripeWebhook } from "./webhooks.js";

export const app = new Hono().basePath("/api");

app.get("/health", (c) =>
  c.json({
    ok: true,
    supabase: hasSupabase(),
    stripe: hasStripe(),
  }),
);

app.get("/founding-pricing", async (c) => {
  try {
    if (!hasSupabase()) {
      return c.json(
        PACKAGE_KEYS.map((key) => ({
          key,
          transactionCount: PACKAGES[key].transactionCount,
          amount: PACKAGES[key].fallbackPriceDollars,
        })),
      );
    }
    return c.json(await getPublicPricing());
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/founding-checkout", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const packageKey = String(body.package || "").toLowerCase();

    if (!isPackageKey(packageKey)) {
      return c.json({ error: "Invalid package. Use one, three, or five." }, 400);
    }

    const plan = await getPricingByKey(packageKey);
    if (!plan?.stripePriceId) {
      return c.json({ error: "This plan is not connected to a Stripe price yet." }, 409);
    }

    const catalog = PACKAGES[packageKey];
    const origin = appUrl(c.req.raw);
    const metadata = {
      product: "founding_transactions",
      package: packageKey,
      transaction_count: String(plan.transactionCount || catalog.transactionCount),
    };

    if (body.utm_source) metadata.utm_source = String(body.utm_source).slice(0, 120);
    if (body.utm_medium) metadata.utm_medium = String(body.utm_medium).slice(0, 120);
    if (body.utm_campaign) metadata.utm_campaign = String(body.utm_campaign).slice(0, 120);
    if (body.referrer) metadata.referrer = String(body.referrer).slice(0, 500);

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      success_url: `${origin}/reserved?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
      metadata,
      payment_intent_data: { metadata },
      customer_creation: "always",
      billing_address_collection: "auto",
    });

    return c.json({ url: session.url });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/stripe/webhook", async (c) => {
  try {
    const signature = c.req.header("stripe-signature");
    if (!signature) {
      return c.json({ error: "Missing Stripe signature." }, 400);
    }
    const rawBody = await c.req.text();
    const result = await processStripeWebhook(rawBody, signature);
    return c.json(result);
  } catch (error) {
    return c.json({ error: error.message }, 400);
  }
});

app.post("/admin/login", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    if (!verifyAdminPassword(body.password)) {
      return c.json({ error: "Invalid password." }, 401);
    }
    setSessionCookie(c, createSessionToken());
    return c.json({ ok: true });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/admin/logout", (c) => {
  clearSessionCookie(c);
  return c.json({ ok: true });
});

app.get("/admin/session", (c) => {
  const session = getSession(c);
  if (!session) return c.json({ authenticated: false }, 401);
  return c.json({ authenticated: true });
});

app.get("/admin/waitlist", async (c) => {
  const unauthorized = requireAdmin(c);
  if (unauthorized) return unauthorized;
  try {
    const url = new URL(c.req.url);
    const result = await listReservations({
      q: url.searchParams.get("q") || "",
      plan: url.searchParams.get("plan") || "",
      status: url.searchParams.get("status") || "",
    });
    return c.json(result);
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/admin/waitlist/:id", async (c) => {
  const unauthorized = requireAdmin(c);
  if (unauthorized) return unauthorized;
  try {
    const user = await getReservation(c.req.param("id"));
    if (!user) return c.json({ error: "User not found." }, 404);
    return c.json({ user });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.patch("/admin/waitlist/:id", async (c) => {
  const unauthorized = requireAdmin(c);
  if (unauthorized) return unauthorized;
  try {
    const body = await c.req.json().catch(() => ({}));
    const user = await updateNotes(c.req.param("id"), body.internalNotes ?? "");
    return c.json({ user });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/admin/waitlist/:id/docs-received", async (c) => {
  const unauthorized = requireAdmin(c);
  if (unauthorized) return unauthorized;
  try {
    const user = await markDocsReceived(c.req.param("id"));
    if (!user) return c.json({ error: "User not found." }, 404);
    return c.json({ user });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/admin/pricing", async (c) => {
  const unauthorized = requireAdmin(c);
  if (unauthorized) return unauthorized;
  try {
    const plans = await listPricingPlans();
    const connected = plans.filter((plan) => plan.connected).length;
    return c.json({
      plans,
      connectedCount: connected,
      totalCount: plans.length,
    });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/admin/pricing/sync", async (c) => {
  const unauthorized = requireAdmin(c);
  if (unauthorized) return unauthorized;
  try {
    const plans = await syncConnectedPrices();
    const connected = plans.filter((plan) => plan.connected).length;
    return c.json({
      plans,
      connectedCount: connected,
      totalCount: plans.length,
    });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.patch("/admin/pricing/:packageKey", async (c) => {
  const unauthorized = requireAdmin(c);
  if (unauthorized) return unauthorized;
  try {
    const packageKey = c.req.param("packageKey");
    if (!isPackageKey(packageKey)) {
      return c.json({ error: "Invalid package." }, 400);
    }
    const body = await c.req.json().catch(() => ({}));
    if (!body.stripePriceId) {
      return c.json({ error: "stripePriceId is required." }, 400);
    }
    const plan = await connectStripePrice(packageKey, body.stripePriceId);
    return c.json({ plan });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/admin/stripe-prices", async (c) => {
  const unauthorized = requireAdmin(c);
  if (unauthorized) return unauthorized;
  try {
    const prices = await listStripeOneTimePrices();
    return c.json({ prices });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});
