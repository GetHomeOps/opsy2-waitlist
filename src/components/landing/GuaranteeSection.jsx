import { backgroundFocus, backgrounds } from "../../config/backgrounds.js";
import { SectionBackground } from "./SectionBackground.jsx";

const points = [
  {
    label: "REFUNDABLE",
    body: "Fully refundable until your first documents land. One reply: REFUND. Processed within 48 hours.",
  },
  {
    label: "NEVER WASTED",
    body: "If a deal falls through, your reservation rolls to your next transaction automatically. You never lose one.",
  },
  {
    label: "LOCKED IN PRICING",
    body: "Book a founding transaction with us and lock in pricing for life.",
  },
];

export function GuaranteeSection() {
  return (
    <section aria-labelledby="guarantee-heading">
      <SectionBackground
        src={backgrounds.guarantee}
        mobilePosition={backgroundFocus.guarantee.mobile}
        tabletPosition={backgroundFocus.guarantee.tablet}
        desktopPosition={backgroundFocus.guarantee.desktop}
        className="min-h-[100svh] lg:min-h-[860px]"
      >
        <div className="mx-auto flex min-h-[100svh] w-full max-w-[1240px] flex-col justify-center px-6 py-16 md:px-10 lg:min-h-[860px] lg:px-16">
          <h2
            id="guarantee-heading"
            className="rise-in max-w-3xl font-serif text-[clamp(2.4rem,5vw,4.25rem)] font-semibold leading-[1.08] text-cream"
          >
            Zero-risk. Zero Overwhelm.
          </h2>

          <div className="mt-14 grid grid-cols-1 gap-10 md:mt-20 md:grid-cols-3 md:gap-12 lg:mt-24">
            {points.map((item) => (
              <div key={item.label} className="max-w-sm">
                <p className="text-[0.78rem] font-bold tracking-[0.28em] text-gold">
                  {item.label}
                </p>
                <p className="mt-4 text-[1.02rem] italic leading-8 text-cream">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </SectionBackground>
    </section>
  );
}
