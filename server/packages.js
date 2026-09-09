export const FOUNDING_CAPACITY = 50;

export const PACKAGES = {
  one: {
    key: "one",
    transactionCount: 1,
    displayName: "One Transaction",
    tagline: "For your next closing",
    fallbackPriceCents: 9900,
    fallbackPriceDollars: 99,
  },
  three: {
    key: "three",
    transactionCount: 3,
    displayName: "Three Transactions",
    tagline: "Most popular",
    fallbackPriceCents: 26700,
    fallbackPriceDollars: 267,
  },
  five: {
    key: "five",
    transactionCount: 5,
    displayName: "Five Transactions",
    tagline: "Best value",
    fallbackPriceCents: 39500,
    fallbackPriceDollars: 395,
  },
};

export const PACKAGE_KEYS = Object.keys(PACKAGES);

export function isPackageKey(value) {
  return Object.prototype.hasOwnProperty.call(PACKAGES, value);
}

export function catalogPricingPlans() {
  return PACKAGE_KEYS.map((key) => {
    const catalog = PACKAGES[key];
    return {
      id: null,
      packageKey: key,
      displayName: catalog.displayName,
      tagline: catalog.tagline,
      transactionCount: catalog.transactionCount,
      displayPrice: catalog.fallbackPriceDollars,
      displayPriceDollars: catalog.fallbackPriceDollars,
      stripePriceId: null,
      stripeAmount: null,
      stripeAmountDollars: null,
      stripeCurrency: "usd",
      isActive: true,
      lastSyncedAt: null,
      connected: false,
      matches: true,
    };
  });
}

export function centsToDollars(cents) {
  return Math.round(Number(cents || 0) / 100);
}

export function dollarsToCents(dollars) {
  return Math.round(Number(dollars || 0) * 100);
}

export function isRefundEligible(row) {
  return row?.payment_status === "paid" && !row?.first_documents_received_at;
}
