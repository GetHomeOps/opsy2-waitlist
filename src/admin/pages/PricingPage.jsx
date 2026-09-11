import { useEffect, useState } from "react";
import { adminFetch } from "../lib/api.js";
import { formatDateTime, formatDollars, formatUsd } from "../lib/format.js";
import { HOUSEHOLD_DEPOSIT, HOUSEHOLD_FOUNDING_RATE, HOUSEHOLD_STANDARD_RATE } from "../../config/homeowner.js";
import { IconCheck, IconDoc, IconHome, IconRefresh, IconWarn, IconInfo } from "../components/Icons.jsx";

const FALLBACK_PLANS = [
  {
    packageKey: "one",
    audience: "agent",
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
    audience: "agent",
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
    audience: "agent",
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
  {
    packageKey: "household",
    audience: "homeowner",
    displayName: "Founding Household",
    tagline: "Your entire first year",
    transactionCount: 1,
    displayPrice: 99,
    standardPrice: 199,
    isDepositPlan: true,
    depositDollars: 1,
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

function planAudience(plan) {
  return plan.audience === "homeowner" ? "homeowner" : "agent";
}

function planBadge(plan) {
  if (planAudience(plan) === "homeowner") return "Homeowners";
  return `${plan.transactionCount} transaction${plan.transactionCount === 1 ? "" : "s"}`;
}

const PLAN_SECTIONS = [
  { audience: "agent", label: "Agents" },
  { audience: "homeowner", label: "Homeowners" },
];

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

function PlanCard({ plan, pricesLoading, savingKey, stripePrices, onConnect }) {
  const isHomeowner = planAudience(plan) === "homeowner";
  const isDepositPlan = Boolean(plan.isDepositPlan || isHomeowner);

  return (
    <article className="overflow-hidden rounded-2xl border border-[#e6e0d4] bg-white shadow-[0_4px_14px_rgba(24,55,47,0.04)]">
      <div className="grid gap-6 px-5 py-5 md:grid-cols-[minmax(220px,280px)_1fr] md:items-start">
        <div className="flex gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eef3ef] text-forest">
            {isHomeowner ? <IconHome className="h-5 w-5" /> : <IconDoc className="h-5 w-5" />}
          </span>
          <div>
            <h3 className="font-serif text-[1.65rem] font-semibold leading-none">
              {plan.displayName}
            </h3>
            <p className="mt-2 inline-flex rounded-full bg-[#f1eee6] px-2.5 py-0.5 text-[0.72rem] font-medium text-forest-deep/60">
              {planBadge(plan)}
            </p>
            <p className="mt-3 font-serif text-[2.4rem] font-semibold leading-none">
              {formatDollars(plan.displayPrice)}
              {isDepositPlan ? (
                <span className="ml-1 font-serif text-[1.05rem] font-semibold text-forest-deep/45">
                  /yr
                </span>
              ) : null}
            </p>
            {isDepositPlan && plan.standardPrice != null ? (
              <p className="mt-2 text-sm text-forest-deep/55">
                Standard rate {formatDollars(plan.standardPrice)}/yr after launch.
              </p>
            ) : null}
            <p className="mt-2 text-sm text-[#b0893e]">{plan.tagline}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label className="block text-[0.72rem] font-semibold text-forest-deep/45">
            Stripe Product
            <select
              value={plan.stripePriceId || ""}
              disabled={pricesLoading || savingKey === plan.packageKey}
              onChange={(event) => onConnect(plan, event.target.value)}
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

          <label className="block text-[0.72rem] font-semibold text-forest-deep/45">
            {isDepositPlan ? "Signup deposit" : "Stripe Amount"}
            <span className="mt-1.5 block rounded-xl border border-[#e6e0d4] bg-[#fbfaf6] px-3 py-2 font-serif text-lg font-semibold normal-case tracking-normal text-forest-deep">
              {plan.stripeAmount == null ? "—" : formatUsd(plan.stripeAmount, { centsIfNeeded: true })}
            </span>
          </label>

          <p className="pb-2 text-[0.78rem] text-forest-deep/50 sm:text-right">
            Last synced: {formatDateTime(plan.lastSyncedAt)}
          </p>
        </div>
      </div>

      {plan.connected && plan.matches && isDepositPlan ? (
        <div className="flex items-center gap-2 border-t border-[#dfe8e2] bg-[#eef5f0] px-5 py-2.5 text-sm text-[#215746]">
          <IconCheck className="h-4 w-4" />
          Landing page shows {formatDollars(plan.displayPrice)} founding vs{" "}
          {formatDollars(plan.standardPrice)} standard. Stripe collects a{" "}
          {formatUsd(plan.stripeAmount, { centsIfNeeded: true })} deposit at signup.
        </div>
      ) : plan.connected && plan.matches ? (
        <div className="flex items-center gap-2 border-t border-[#dfe8e2] bg-[#eef5f0] px-5 py-2.5 text-sm text-[#215746]">
          <IconCheck className="h-4 w-4" />
          Website display price matches Stripe amount ({formatUsd(plan.stripeAmount)}).
        </div>
      ) : plan.connected && isDepositPlan ? (
        <div className="flex items-center gap-2 border-t border-[#eadfc6] bg-[#f8f1de] px-5 py-2.5 text-sm text-[#7a6128]">
          <IconWarn className="h-4 w-4" />
          {`Founding rate is ${formatDollars(plan.displayPrice)}, but Stripe is connected to ${formatUsd(plan.stripeAmount, { centsIfNeeded: true })} instead of the $${plan.depositDollars ?? 1} signup deposit.`}
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
  );
}

export function PricingPage() {
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [connectedCount, setConnectedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(4);
  const [stripePrices, setStripePrices] = useState([]);
  const [pricesLoading, setPricesLoading] = useState(true);
  const [error, setError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [savingKey, setSavingKey] = useState("");

  function applyPricing(data) {
    setPlans(data.plans || []);
    setConnectedCount(data.connectedCount || 0);
    setTotalCount(data.totalCount || 4);
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
            Connect agent and homeowner waitlist plans to Stripe and manage what appears on the
            landing pages.
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

      <div className="mt-7 space-y-8">
        {PLAN_SECTIONS.map((section) => {
          const sectionPlans = plans.filter((plan) => planAudience(plan) === section.audience);
          if (sectionPlans.length === 0) return null;
          return (
            <section key={section.audience}>
              <h2 className="mb-3 text-[0.78rem] font-semibold uppercase tracking-[0.14em] text-forest-deep/45">
                {section.label}
              </h2>
              <div className="space-y-4">
                {sectionPlans.map((plan) => (
                  <PlanCard
                    key={plan.packageKey}
                    plan={plan}
                    pricesLoading={pricesLoading}
                    savingKey={savingKey}
                    stripePrices={stripePrices}
                    onConnect={connectPlan}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-6 flex gap-3 rounded-2xl border border-[#d7e2ea] bg-[#eef4f8] px-4 py-4 text-sm text-[#35586b]">
        <IconInfo className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-semibold">Agent plans should match Stripe. Homeowner checkout is a deposit.</p>
          <p className="mt-1 leading-6">
            {`Agent landing prices should match the connected Stripe prices. The homeowner founding rate is ${formatDollars(HOUSEHOLD_FOUNDING_RATE)} vs a ${formatDollars(HOUSEHOLD_STANDARD_RATE)} standard rate; Stripe only collects a $${HOUSEHOLD_DEPOSIT} deposit at signup.`}
          </p>
        </div>
      </div>
    </main>
  );
}
