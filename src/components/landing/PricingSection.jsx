import { useEffect, useState } from "react";
import { fetchFoundingPricing } from "../../lib/checkout.js";
import { backgroundFocus, backgrounds } from "../../config/backgrounds.js";
import { CheckoutModal } from "./CheckoutModal.jsx";
import { PricingCard } from "./PricingCard.jsx";
import { SectionBackground } from "./SectionBackground.jsx";

const fallbackPlans = [
  {
    plan: "one",
    label: "ONE TRANSACTION",
    price: "$99",
    detail: "your next closing",
    cta: "Reserve one",
  },
  {
    plan: "three",
    label: "THREE TRANSACTIONS",
    price: "$267",
    detail: "$89 each",
    cta: "Reserve three",
    featured: true,
  },
  {
    plan: "five",
    label: "FIVE TRANSACTIONS",
    price: "$395",
    detail: "$79 each",
    cta: "Reserve five",
  },
];

export function PricingSection() {
  const [plans, setPlans] = useState(fallbackPlans);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    fetchFoundingPricing().then((rows) => {
      if (!rows?.length) return;
      setPlans((current) =>
        current.map((item) => {
          const match = rows.find((row) => row.key === item.plan);
          if (!match?.amount) return item;
          return { ...item, price: `$${match.amount}` };
        }),
      );
    });
  }, []);

  return (
    <section id="pricing" aria-labelledby="pricing-heading">
      <SectionBackground
        src={backgrounds.pricing}
        mobilePosition={backgroundFocus.pricing.mobile}
        tabletPosition={backgroundFocus.pricing.tablet}
        desktopPosition={backgroundFocus.pricing.desktop}
        className="min-h-[100svh] lg:min-h-[960px]"
        overlayClassName="bg-gradient-to-b from-transparent to-black/10"
      >
        <div className="mx-auto flex min-h-[100svh] w-full max-w-[1200px] flex-col px-6 py-14 md:px-10 lg:min-h-[960px] lg:py-16">
          <h2
            id="pricing-heading"
            className="rise-in text-center font-serif text-[clamp(2.4rem,5vw,4.1rem)] font-bold leading-[1.05] text-forest-deep"
          >
            Only 50 Founding
            <br />
            Transactions!
          </h2>

          <div className="mx-auto mt-auto grid w-full max-w-[980px] grid-cols-1 gap-6 pt-12 md:grid-cols-3 md:items-stretch md:gap-5 lg:pt-16">
            {plans.map((item) => (
              <PricingCard
                key={item.plan}
                {...item}
                onSelect={() => setSelectedPlan(item)}
              />
            ))}
          </div>
        </div>
      </SectionBackground>
      {selectedPlan ? (
        <CheckoutModal
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
        />
      ) : null}
    </section>
  );
}
