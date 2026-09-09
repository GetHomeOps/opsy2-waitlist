import { useEffect, useState } from "react";
import { adminFetch } from "../lib/api.js";
import { formatDateTime, formatDollars, formatUsd } from "../lib/format.js";
import { IconCheck, IconDoc, IconRefresh, IconWarn, IconInfo } from "../components/Icons.jsx";

const FALLBACK_PLANS = [
  {
    packageKey: "one",
    displayName: "One Transaction",
    tagline: "For your next closing",
    transactionCount: 1,
    displayPrice: 99,
    stripePriceId: null,
    stripeAmount: null,
    lastSyncedAt: null,
    connected: false,
    matches: true,
  },
  {
    packageKey: "three",
    displayName: "Three Transactions",
    tagline: "Most popular",
    transactionCount: 3,
    displayPrice: 267,
    stripePriceId: null,
    stripeAmount: null,
    lastSyncedAt: null,
    connected: false,
    matches: true,
  },
  {
    packageKey: "five",
    displayName: "Five Transactions",
    tagline: "Best value",
    transactionCount: 5,
    displayPrice: 395,
    stripePriceId: null,
    stripeAmount: null,
    lastSyncedAt: null,
    connected: false,
    matches: true,
  },
];

function stripePriceLabel(price) {
  const name = price.nickname ? `${price.productName} · ${price.nickname}` : price.productName;
  if (price.unitAmount == null) return name;
  const amount = formatUsd(price.unitAmount, { centsIfNeeded: true });
  if (price.type === "recurring" && price.interval) {
    return `${name} — ${amount} / ${price.interval}`;
  }
  return `${name} — ${amount}`;
}

function optionsForPlan(plan, prices) {
  if (plan.stripePriceId && !prices.some((price) => price.id === plan.stripePriceId)) {
    return [
      {
        id: plan.stripePriceId,
        productName: plan.stripePriceId,
        unitAmount: plan.stripeAmount,
        nickname: "Currently connected",
      },
      ...prices,
    ];
  }
  return prices;
}

export function PricingPage() {
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [connectedCount, setConnectedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(3);
  const [stripePrices, setStripePrices] = useState([]);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [savingKey, setSavingKey] = useState("");

  function applyPricing(data) {
    setPlans(data.plans || []);
    setConnectedCount(data.connectedCount || 0);
    setTotalCount(data.totalCount || 3);
  }

  async function load() {
    setError("");
    setPricesLoading(true);
    try {
      const [pricing, stripe] = await Promise.all([
        adminFetch("/api/admin/pricing"),
        adminFetch("/api/admin/stripe-prices").catch((err) => ({
          prices: [],
          error: err.message,
        })),
      ]);
      applyPricing(pricing);
      setStripePrices(stripe.prices || []);
      if (stripe.error) setError(stripe.error);
    } catch (err) {
      setError(err.message);
    } finally {
      setPricesLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function sync() {
    setSyncing(true);
    setError("");
    try {
      applyPricing(await adminFetch("/api/admin/pricing/sync", { method: "POST", json: {} }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSyncing(false);
    }
  }

  async function connectPlan(plan, stripePriceId) {
    if (!stripePriceId || stripePriceId === plan.stripePriceId) return;
    setSavingKey(plan.packageKey);
    setError("");
    try {
      const data = await adminFetch(`/api/admin/pricing/${plan.packageKey}`, {
        method: "PATCH",
        json: { stripePriceId },
      });
      setPlans((current) => {
        const next = current.map((item) =>
          item.packageKey === data.plan.packageKey ? data.plan : item,
        );
        setConnectedCount(next.filter((item) => item.connected).length);
        return next;
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingKey("");
    }
  }

  const allConnected = connectedCount === totalCount && totalCount > 0;

  return (
    <main className="min-w-0 flex-1 px-5 py-7 md:px-8 lg:px-10">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="font-serif text-[2.35rem] font-semibold leading-none text-forest-deep">
            Pricing Plans
          </h1>
          <p className="mt-2 max-w-[36rem] text-[0.95rem] text-forest-deep/65">
            Connect your waitlist plans to Stripe and manage what appears on the landing page.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.78rem] font-medium ${
              allConnected ? "bg-[#e7f0ea] text-forest" : "bg-[#f3f0e9] text-forest-deep/70"
            }`}
          >
            {allConnected ? <IconCheck className="h-3.5 w-3.5" /> : null}
            {connectedCount} of {totalCount} plans connected
          </span>
          <button
            type="button"
            onClick={sync}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-cream hover:bg-forest-mid disabled:opacity-60"
          >
            <IconRefresh className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            Sync from Stripe
          </button>
        </div>
      </header>

      {error ? (
        <div className="mt-4 rounded-xl border border-[#eadfc6] bg-[#f8f1de] px-4 py-3 text-sm text-[#7a6128]">
          {error}
        </div>
      ) : null}

      <div className="mt-7 space-y-4">
        {plans.map((plan) => (
          <article
            key={plan.packageKey}
            className="overflow-hidden rounded-2xl border border-[#e6e0d4] bg-white shadow-[0_4px_14px_rgba(24,55,47,0.04)]"
          >
            <div className="grid gap-6 px-5 py-5 md:grid-cols-[minmax(220px,280px)_1fr] md:items-start">
              <div className="flex gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eef3ef] text-forest">
                  <IconDoc className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="font-serif text-[1.65rem] font-semibold leading-none">
                    {plan.displayName}
                  </h2>
                  <p className="mt-2 inline-flex rounded-full bg-[#f1eee6] px-2.5 py-0.5 text-[0.72rem] font-medium text-forest-deep/60">
                    {plan.transactionCount} transaction{plan.transactionCount === 1 ? "" : "s"}
                  </p>
                  <p className="mt-3 font-serif text-[2.4rem] font-semibold leading-none">
                    {formatDollars(plan.displayPrice)}
                  </p>
                  <p className="mt-2 text-sm text-[#b0893e]">{plan.tagline}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                <label className="block text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-forest-deep/45">
                  Stripe product
                  <select
                    value={plan.stripePriceId || ""}
                    disabled={pricesLoading || savingKey === plan.packageKey}
                    onChange={(event) => connectPlan(plan, event.target.value)}
                    className="admin-select mt-1.5 w-full rounded-xl border border-[#e6e0d4] bg-[#fbfaf6] px-3 py-2 pr-9 text-[0.85rem] font-normal normal-case tracking-normal text-forest-deep outline-none focus:border-forest disabled:opacity-70"
                  >
                    <option value="">
                      {pricesLoading
                        ? "Loading products…"
                        : savingKey === plan.packageKey
                          ? "Saving…"
                          : "Select a Stripe product…"}
                    </option>
                    {optionsForPlan(plan, stripePrices).map((price) => (
                      <option key={price.id} value={price.id}>
                        {stripePriceLabel(price)}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="flex items-center gap-2 pb-2 text-sm">
                  <span
                    className={`h-2 w-2 rounded-full ${plan.connected ? "bg-[#2f7a5d]" : "bg-[#c4a15f]"}`}
                  />
                  <span className="font-medium">{plan.connected ? "Connected" : "Not connected"}</span>
                </div>

                <label className="block text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-forest-deep/45">
                  Stripe Amount
                  <span className="mt-1.5 block rounded-xl border border-[#e6e0d4] bg-[#fbfaf6] px-3 py-2 font-serif text-lg font-semibold normal-case tracking-normal text-forest-deep">
                    {plan.stripeAmount == null ? "—" : formatUsd(plan.stripeAmount, { centsIfNeeded: true })}
                  </span>
                </label>

                <p className="pb-2 text-[0.78rem] text-forest-deep/50 sm:text-right">
                  Last synced: {formatDateTime(plan.lastSyncedAt)}
                </p>
              </div>
            </div>

            {plan.connected && plan.matches ? (
              <div className="flex items-center gap-2 border-t border-[#dfe8e2] bg-[#eef5f0] px-5 py-2.5 text-sm text-[#215746]">
                <IconCheck className="h-4 w-4" />
                Website display price matches Stripe amount ({formatUsd(plan.stripeAmount)}).
              </div>
            ) : plan.connected ? (
              <div className="flex items-center gap-2 border-t border-[#eadfc6] bg-[#f8f1de] px-5 py-2.5 text-sm text-[#7a6128]">
                <IconWarn className="h-4 w-4" />
                Website displays {formatDollars(plan.displayPrice)} but Stripe will charge{" "}
                {formatUsd(plan.stripeAmount)}.
              </div>
            ) : (
              <div className="flex items-center gap-2 border-t border-[#eadfc6] bg-[#f8f1de] px-5 py-2.5 text-sm text-[#7a6128]">
                <IconWarn className="h-4 w-4" />
                Connect a Stripe price before this plan can be purchased.
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="mt-6 flex gap-3 rounded-2xl border border-[#d7e2ea] bg-[#eef4f8] px-4 py-4 text-sm text-[#35586b]">
        <IconInfo className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">Landing page pricing should match the connected Stripe prices.</p>
          <p className="mt-1 leading-6">
            Make sure the prices displayed on your marketing site are the same as your Stripe
            prices to avoid confusion for potential customers.
          </p>
        </div>
      </div>
    </main>
  );
}
