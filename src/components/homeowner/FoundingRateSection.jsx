import { useEffect, useState } from "react";
import { FOUNDING_HOUSEHOLD_CAP, homeownerAssets } from "../../config/homeowner.js";
import { fetchHouseholdCount } from "../../lib/waitlist.js";
import { PictureBackdrop } from "./PictureBackdrop.jsx";
import { Reveal } from "./Reveal.jsx";

export function FoundingRateSection({ onLockRate }) {
  const [households, setHouseholds] = useState(null);

  useEffect(() => {
    fetchHouseholdCount().then((data) => {
      if (!data) return;
      setHouseholds(data);
    });
  }, []);

  const cap = households?.cap ?? FOUNDING_HOUSEHOLD_CAP;
  const countLabel =
    households && typeof households.count === "number"
      ? `${households.count} of ${cap} Founding Households`
      : `of ${cap} Founding Households`;

  return (
    <section
      id="founding-rate"
      aria-labelledby="founding-rate-heading"
      className="relative overflow-hidden bg-ho-cream"
    >
      <PictureBackdrop
        {...homeownerAssets.pricing}
        sizes="100vw"
        className="scale-105"
      />
      <div className="absolute inset-0 bg-[#f8f5ed]/88" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[1100px] flex-col justify-center px-6 py-20 md:px-10 lg:min-h-[860px] lg:py-24">
        <Reveal className="text-center">
          <h2
            id="founding-rate-heading"
            className="font-serif text-[clamp(2.6rem,5.4vw,4.4rem)] font-semibold leading-[1.05] text-ho-forest"
          >
            The founding rate
          </h2>
          <p className="mt-4 text-[1.02rem] tracking-wide text-ho-forest/70 md:text-[1.08rem]">
            {countLabel}
          </p>
        </Reveal>

        <div className="mx-auto mt-14 grid w-full max-w-[820px] grid-cols-1 gap-10 md:mt-16 md:grid-cols-2 md:items-stretch md:gap-8">
          <div className="ho-card-enter">
            <div className="pricing-card relative h-full pt-5">
              <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
                <span className="inline-flex rounded-full bg-ho-gold px-4 py-1.5 text-[0.68rem] font-bold tracking-[0.16em] text-ho-forest">
                  FOUNDING HOUSEHOLD
                </span>
              </div>
              <article className="flex h-full min-h-[320px] flex-col items-center rounded-[22px] border-2 border-ho-gold bg-white px-8 pb-9 pt-12 text-center">
                <p className="font-serif text-[clamp(4.2rem,8vw,5.4rem)] font-semibold leading-none text-ho-forest">
                  $99
                </p>
                <p className="mt-3 text-[1rem] text-ho-forest/70">your entire first year</p>
                <button
                  type="button"
                  onClick={onLockRate}
                  className="pricing-cta mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-ho-gold px-8 py-3 text-[0.95rem] font-semibold tracking-wide text-ho-forest transition-[background-color,transform] duration-300 hover:bg-ho-gold-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ho-forest motion-safe:hover:scale-[1.03]"
                >
                  Lock the founding rate
                </button>
              </article>
            </div>
          </div>

          <div className="ho-card-enter" style={{ animationDelay: "80ms" }}>
            <div className="pricing-card relative h-full pt-5">
              <article className="flex h-full min-h-[320px] flex-col items-center rounded-[22px] border border-[#c9d2c6] bg-[#f3eee3] px-8 py-12 text-center">
                <p className="text-[0.72rem] font-bold tracking-[0.16em] text-ho-forest/55">
                  STANDARD RATE
                </p>
                <p className="mt-6 font-serif text-[clamp(3.4rem,7vw,4.4rem)] font-semibold leading-none text-ho-forest">
                  $199<span className="text-[0.42em] font-semibold">/yr</span>
                </p>
                <p className="mx-auto mt-5 max-w-[18rem] text-[0.95rem] leading-7 text-ho-forest/65">
                  expected after launch — subject to change. Your founding rate is
                  locked for your entire first year.
                </p>
              </article>
            </div>
          </div>
        </div>

        <p className="mx-auto mt-12 max-w-[28rem] text-center text-[0.98rem] italic leading-7 text-ho-forest/60">
          Reserve with your email only — you&apos;re charged at launch, not today.
        </p>
      </div>
    </section>
  );
}
