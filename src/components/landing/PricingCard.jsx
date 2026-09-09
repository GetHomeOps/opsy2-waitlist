import { useState } from "react";
import { handleCheckout } from "../../lib/checkout.js";
import { ReserveButton } from "./ReserveButton.jsx";

export function PricingCard({
  plan,
  label,
  price,
  detail,
  cta,
  featured = false,
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onReserve() {
    setBusy(true);
    setError("");
    try {
      await handleCheckout(plan);
    } catch (err) {
      console.error(err);
      setError("Checkout is unavailable right now. Please try again shortly.");
      setBusy(false);
    }
  }

  return (
    <div className="pricing-card relative pt-5">
      {featured ? (
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
          <span className="inline-flex rounded-full bg-gold px-4 py-1 text-[0.68rem] font-bold tracking-[0.16em] text-forest-deep">
            MOST RESERVED
          </span>
        </div>
      ) : null}

      <article
        className={`pricing-shadow flex h-full min-h-[280px] flex-col items-center rounded-[22px] bg-cream-warm px-7 pb-8 pt-10 text-center ${
          featured ? "border-2 border-gold" : "border-2 border-transparent"
        }`}
      >
        <p className="text-[0.72rem] font-bold tracking-[0.16em] text-forest-deep">
          {label}
        </p>
        <p className="mt-5 font-serif text-[clamp(3.4rem,6vw,4.4rem)] font-bold leading-none text-forest-deep">
          {price}
        </p>
        <p className="mt-3 font-medium text-[0.95rem] text-forest-deep/80">{detail}</p>
        <ReserveButton
          variant={featured ? "gold" : "forest"}
          className="pricing-cta mt-8 w-full max-w-[200px]"
          onClick={onReserve}
        >
          {busy ? "Redirecting…" : cta}
        </ReserveButton>
        {error ? (
          <p className="mt-3 max-w-[220px] text-[0.75rem] leading-5 text-forest-deep/70">{error}</p>
        ) : null}
      </article>
    </div>
  );
}
