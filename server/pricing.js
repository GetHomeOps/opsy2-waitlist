import { getDb, dbError, landingTables } from "./db.js";
import { getStripe } from "./stripe.js";
import { PACKAGES, PACKAGE_KEYS, centsToDollars, dollarsToCents } from "./packages.js";

function displayPriceDollars(row) {
  const catalog = PACKAGES[row.package_key];
  const raw = Number(row.display_price);
  if (catalog && raw === catalog.fallbackPriceCents) {
    return catalog.fallbackPriceDollars;
  }
  if (row.stripe_amount != null && Number(row.stripe_amount) === raw) {
    return centsToDollars(raw);
  }
  return raw;
}

async function healLegacyCentDisplayPrices(rows) {
  const stale = rows.filter((row) => displayPriceDollars(row) !== Number(row.display_price));
  if (stale.length === 0) return;

  const db = getDb();
  await Promise.all(
    stale.map((row) =>
      db
        .from(landingTables.pricing)
        .update({ display_price: displayPriceDollars(row) })
        .eq("package_key", row.package_key),
    ),
  );
}

function serializePlan(row) {
  const catalog = PACKAGES[row.package_key];
  const stripeAmount = row.stripe_amount ?? null;
  const displayPrice = displayPriceDollars(row);
  const connected = Boolean(row.stripe_price_id);
  const matches =
    connected && stripeAmount != null
      ? dollarsToCents(displayPrice) === Number(stripeAmount)
      : true;

  return {
    id: row.id,
    packageKey: row.package_key,
    displayName: row.display_name || catalog?.displayName,
    tagline: row.tagline || catalog?.tagline,
    transactionCount: row.transaction_count,
    displayPrice,
    displayPriceDollars: Number(displayPrice),
    stripePriceId: row.stripe_price_id,
    stripeAmount,
    stripeAmountDollars: stripeAmount == null ? null : centsToDollars(stripeAmount),
    stripeCurrency: row.stripe_currency || "usd",
    isActive: row.is_active,
    lastSyncedAt: row.last_synced_at,
    connected,
    matches,
  };
}

export async function listPricingPlans() {
  const db = getDb();
  const { data, error } = await db
    .from(landingTables.pricing)
    .select("*")
    .in("package_key", PACKAGE_KEYS)
    .order("transaction_count", { ascending: true });

  if (error) throw new Error(dbError(error));
  const rows = data || [];
  await healLegacyCentDisplayPrices(rows).catch(() => {});
  return rows.map(serializePlan);
}

export async function getPublicPricing() {
  const plans = await listPricingPlans();
  return plans
    .filter((plan) => plan.isActive)
    .map((plan) => {
      const amount =
        plan.connected && plan.stripeAmount != null
          ? centsToDollars(plan.stripeAmount)
          : Number(plan.displayPrice);
      return {
        key: plan.packageKey,
        transactionCount: plan.transactionCount,
        amount,
      };
    });
}

export async function getPricingByKey(packageKey) {
  const db = getDb();
  const { data, error } = await db
    .from(landingTables.pricing)
    .select("*")
    .eq("package_key", packageKey)
    .maybeSingle();

  if (error) throw new Error(dbError(error));
  return data ? serializePlan(data) : null;
}

async function retrieveStripeAmount(priceId) {
  const stripe = getStripe();
  const price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
  if (!price?.active) {
    throw new Error("That Stripe price is not active.");
  }
  if (price.type !== "one_time") {
    throw new Error(
      "Waitlist plans must use a one-time Stripe price. Create one-time prices for these packages in Stripe, then select them here.",
    );
  }
  return price;
}

export async function connectStripePrice(packageKey, stripePriceId) {
  const price = await retrieveStripeAmount(stripePriceId);
  const db = getDb();
  const { data, error } = await db
    .from(landingTables.pricing)
    .update({
      stripe_price_id: price.id,
      stripe_amount: price.unit_amount,
      stripe_currency: price.currency,
      display_price: centsToDollars(price.unit_amount),
      last_synced_at: new Date().toISOString(),
    })
    .eq("package_key", packageKey)
    .select("*")
    .single();

  if (error) throw new Error(dbError(error));
  return serializePlan(data);
}

export async function syncConnectedPrices() {
  const plans = await listPricingPlans();
  const results = [];

  for (const plan of plans) {
    if (!plan.stripePriceId) {
      results.push(plan);
      continue;
    }
    const price = await retrieveStripeAmount(plan.stripePriceId);
    const db = getDb();
    const { data, error } = await db
      .from(landingTables.pricing)
      .update({
        stripe_amount: price.unit_amount,
        stripe_currency: price.currency,
        display_price: centsToDollars(price.unit_amount),
        last_synced_at: new Date().toISOString(),
      })
      .eq("package_key", plan.packageKey)
      .select("*")
      .single();

    if (error) throw new Error(dbError(error));
    results.push(serializePlan(data));
  }

  return results;
}

function productNameFrom(product, fallback = "Stripe product") {
  if (product && typeof product === "object" && !product.deleted) {
    return product.name || fallback;
  }
  if (typeof product === "string") return product;
  return fallback;
}

function productIdFrom(product) {
  if (product && typeof product === "object" && !product.deleted) return product.id;
  if (typeof product === "string") return product;
  return null;
}

function serializeStripePrice(price, product) {
  return {
    id: price.id,
    productId: productIdFrom(product) || productIdFrom(price.product),
    productName: productNameFrom(product || price.product),
    unitAmount: price.unit_amount,
    currency: price.currency,
    nickname: price.nickname,
    type: price.type,
    interval: price.recurring?.interval || null,
  };
}

async function listAll(stripe, resource, params) {
  const rows = [];
  let startingAfter;
  do {
    const page = await stripe[resource].list({
      ...params,
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });
    rows.push(...page.data);
    startingAfter = page.has_more ? page.data[page.data.length - 1]?.id : null;
  } while (startingAfter);
  return rows;
}

export async function listStripeOneTimePrices() {
  const stripe = getStripe();
  const prices = await listAll(stripe, "prices", {
    active: true,
    expand: ["data.product"],
  });

  return prices
    .filter((price) => price.unit_amount != null)
    .map((price) => serializeStripePrice(price))
    .sort(
      (left, right) =>
        left.productName.localeCompare(right.productName) ||
        Number(left.unitAmount) - Number(right.unitAmount),
    );
}
