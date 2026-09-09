import { useEffect, useState } from "react";
import { adminFetch } from "../lib/api.js";
import { formatUsd } from "../lib/format.js";
import { IconClose } from "./Icons.jsx";

export function ChangePriceModal({ plan, onClose, onSaved }) {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");

  useEffect(() => {
    let cancelled = false;
    adminFetch("/api/admin/stripe-prices")
      .then((data) => {
        if (!cancelled) setPrices(data.prices || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function selectPrice(price) {
    setSaving(price.id);
    setError("");
    try {
      const data = await adminFetch(`/api/admin/pricing/${plan.packageKey}`, {
        method: "PATCH",
        json: { stripePriceId: price.id },
      });
      onSaved(data.plan);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-deep/25 p-4">
      <div className="w-full max-w-[560px] overflow-hidden rounded-2xl border border-[#e6e0d4] bg-[#fbfaf6] shadow-[0_16px_40px_rgba(24,55,47,0.16)]">
        <div className="flex items-start justify-between border-b border-[#eee9de] px-5 py-4">
          <div>
            <h2 className="font-serif text-2xl font-semibold">Change Price</h2>
            <p className="mt-1 text-sm text-forest-deep/60">
              Map {plan.displayName} to an existing one-time Stripe price.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-forest-deep/50" aria-label="Close">
            <IconClose className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto px-5 py-4">
          {loading ? <p className="text-sm text-forest-deep/55">Loading Stripe prices…</p> : null}
          {error ? <p className="mb-3 text-sm text-[#8b4a42]">{error}</p> : null}
          {!loading && prices.length === 0 ? (
            <p className="text-sm text-forest-deep/55">
              No active one-time Stripe prices were found. Create them in the Stripe Dashboard first.
            </p>
          ) : null}
          <div className="space-y-2">
            {prices.map((price) => (
              <button
                key={price.id}
                type="button"
                disabled={Boolean(saving)}
                onClick={() => selectPrice(price)}
                className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left ${
                  plan.stripePriceId === price.id
                    ? "border-forest bg-[#eef4f0]"
                    : "border-[#e6e0d4] bg-white hover:bg-[#f7f4ee]"
                }`}
              >
                <div>
                  <p className="font-medium">{price.productName}</p>
                  <p className="mt-1 font-mono text-[0.72rem] text-forest-deep/50">{price.id}</p>
                </div>
                <div className="text-right">
                  <p className="font-serif text-xl font-semibold">
                    {formatUsd(price.unitAmount, { centsIfNeeded: true })}
                  </p>
                  <p className="text-[0.7rem] uppercase tracking-[0.08em] text-forest-deep/45">
                    {price.currency}
                    {saving === price.id ? " • Saving" : ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
