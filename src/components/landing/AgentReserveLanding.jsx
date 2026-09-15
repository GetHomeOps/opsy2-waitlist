import { backgroundFocus, backgrounds } from "../../config/backgrounds.js";
import { FAQContent, FAQSection } from "./FAQSection.jsx";
import { FounderSection } from "./FounderSection.jsx";
import { GuaranteeSection } from "./GuaranteeSection.jsx";
import { HeroSection } from "./HeroSection.jsx";
import { HowItWorksSection } from "./HowItWorksSection.jsx";
import { PricingSection } from "./PricingSection.jsx";
import { SectionBackground } from "./SectionBackground.jsx";
import { SiteFooter } from "./SiteFooter.jsx";

export function AgentReserveLanding() {
  return (
    <main>
      <HeroSection />
      <HowItWorksSection />
      <PricingSection />
      <GuaranteeSection />
      <FounderSection />
      <FAQSection>
        <SectionBackground
          src={backgrounds.faq}
          mobilePosition={backgroundFocus.faq.mobile}
          tabletPosition={backgroundFocus.faq.tablet}
          desktopPosition={backgroundFocus.faq.desktop}
          className="min-h-[100svh] bg-cream-warm lg:min-h-[860px]"
        >
          <div className="mx-auto flex min-h-[100svh] w-full max-w-[1240px] flex-col px-6 py-14 md:px-10 lg:min-h-[860px] lg:px-16 lg:py-16">
            <FAQContent />
            <div className="mt-auto">
              <SiteFooter />
            </div>
          </div>
        </SectionBackground>
      </FAQSection>
    </main>
  );
}
