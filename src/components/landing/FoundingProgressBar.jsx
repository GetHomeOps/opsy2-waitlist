export function FoundingProgressBar({ count, cap }) {
  const safeCap = Math.max(1, Number(cap) || 1);
  const safeCount = Math.max(0, Math.min(Number(count) || 0, safeCap));
  const percent = Math.round((safeCount / safeCap) * 100);

  return (
    <div className="rise-in mx-auto w-full max-w-[26rem] md:max-w-[32rem]">
      <h2
        id="pricing-heading"
        className="text-center font-serif text-[clamp(1.7rem,3.4vw,2.25rem)] font-semibold leading-tight text-forest-deep"
      >
        Founding Transactions
      </h2>

      <div
        className="mt-5 h-4 overflow-hidden rounded-full bg-forest-deep/20 shadow-[inset_0_1px_2px_rgba(24,55,47,0.12)] md:mt-6 md:h-[1.125rem]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeCap}
        aria-valuenow={safeCount}
        aria-valuetext={`${safeCount} of ${safeCap} Founding Transactions`}
        aria-label="Founding transaction progress"
      >
        <div
          className="founding-progress-fill h-full rounded-full bg-forest-deep"
          style={{ "--founding-progress": `${percent}%` }}
        />
      </div>

      <p className="mt-3.5 text-center font-serif text-[1.35rem] font-semibold tracking-wide text-forest-deep md:text-[1.5rem]">
        {safeCount} of {safeCap}
      </p>
    </div>
  );
}
