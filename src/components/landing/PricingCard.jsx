import { ReserveButton } from "./ReserveButton.jsx";

export function PricingCard({
  label,
  price,
  detail,
  cta,
  featured = false,
  onSelect,
}) {
  return (
    <div className="pricing-card relative pt-5">
      {featured ? (
        <div className="absolute inset-x-0 top-0 z-10 flex justify-center">
          <span className="inline-flex whitespace-nowrap rounded-full bg-gold px-4 py-1 text-center text-[0.68rem] font-bold tracking-[0.16em] text-forest-deep">
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
          onClick={onSelect}
        >
          {cta}
        </ReserveButton>
      </article>
    </div>
  );
}
