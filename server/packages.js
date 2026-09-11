export const FOUNDING_CAPACITY = 50;

export const AGENT_PACKAGES = {
  one: {
    key: "one",
    audience: "agent",
    transactionCount: 1,
    displayName: "One Transaction",
    tagline: "For your next closing",
    fallbackPriceCents: 9900,
    fallbackPriceDollars: 99,
  },
  three: {
    key: "three",
    audience: "agent",
    transactionCount: 3,
    displayName: "Three Transactions",
    tagline: "Most popular",
    fallbackPriceCents: 26700,
    fallbackPriceDollars: 267,
  },
  five: {
    key: "five",
    audience: "agent",
    transactionCount: 5,
    displayName: "Five Transactions",
    tagline: "Best value",
    fallbackPriceCents: 39500,
    fallbackPriceDollars: 395,
  },
};

export const HOMEOWNER_PACKAGES = {
  household: {
    key: "household",
    audience: "homeowner",
    transactionCount: 1,
    displayName: "Founding Household",
    tagline: "Your entire first year",
    fallbackPriceCents: 9900,
    fallbackPriceDollars: 99,
    standardPriceDollars: 199,
    depositCents: 100,
    depositDollars: 1,
  },
};

export const PACKAGES = { ...AGENT_PACKAGES, ...HOMEOWNER_PACKAGES };
export const AGENT_PACKAGE_KEYS = Object.keys(AGENT_PACKAGES);
export const PACKAGE_KEYS = Object.keys(PACKAGES);

export function isPackageKey(value) {
  return Object.prototype.hasOwnProperty.call(PACKAGES, value);
}

export function isAgentPackageKey(value) {
  return Object.prototype.hasOwnProperty.call(AGENT_PACKAGES, value);
}

export function isDepositPackage(value) {
  const key = typeof value === "string" ? value : value?.packageKey || value?.key;
  return PACKAGES[key]?.audience === "homeowner";
}

export function sortPricingPlans(plans) {
  return [...plans].sort((left, right) => {
    const leftAudience = left.audience === "homeowner" ? 1 : 0;
    const rightAudience = right.audience === "homeowner" ? 1 : 0;
    if (leftAudience !== rightAudience) return leftAudience - rightAudience;
    return Number(left.transactionCount) - Number(right.transactionCount);
  });
}

export function catalogPricingPlans() {
  return sortPricingPlans(
    PACKAGE_KEYS.map((key) => {
      const catalog = PACKAGES[key];
      return {
        id: null,
        packageKey: key,
        audience: catalog.audience,
        displayName: catalog.displayName,
        tagline: catalog.tagline,
        transactionCount: catalog.transactionCount,
        displayPrice: catalog.fallbackPriceDollars,
        displayPriceDollars: catalog.fallbackPriceDollars,
        standardPrice: catalog.standardPriceDollars ?? null,
        isDepositPlan: catalog.audience === "homeowner",
        depositDollars: catalog.depositDollars ?? null,
        stripePriceId: null,
        stripeAmount: null,
        stripeAmountDollars: null,
        stripeCurrency: "usd",
        isActive: true,
        lastSyncedAt: null,
        connected: false,
        matches: true,
      };
    }),
  );
}

export function centsToDollars(cents) {
  return Math.round(Number(cents || 0) / 100);
}

export function dollarsToCents(dollars) {
  return Math.round(Number(dollars || 0) * 100);
}

export const PAID_CHECKOUT_STATUSES = new Set(["paid", "no_payment_required"]);

export function isPaidCheckoutStatus(status) {
  return PAID_CHECKOUT_STATUSES.has(status);
}

export function isRefundEligible(row) {
  return row?.payment_status === "paid" && !row?.first_documents_received_at;
}
