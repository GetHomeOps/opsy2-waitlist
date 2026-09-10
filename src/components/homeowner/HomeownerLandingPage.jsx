import { useEffect, useRef, useState } from "react";
import { FoundingRateSection } from "./FoundingRateSection.jsx";
import { HomeownerFeatures } from "./HomeownerFeatures.jsx";
import { HomeownerHero } from "./HomeownerHero.jsx";
import { HomeownerWaitlistForm } from "./HomeownerWaitlistForm.jsx";

export function HomeownerLandingPage() {
  const waitlistRef = useRef(null);
  const [emailPrefill, setEmailPrefill] = useState("");
  const [focusToken, setFocusToken] = useState(0);

  useEffect(() => {
    document.title = "Opsy | Founding Households";
    return () => {
      document.title = "Opsy | Founding Transactions";
    };
  }, []);

  function goToWaitlist(email = "") {
    if (email) setEmailPrefill(email);
    setFocusToken((current) => current + 1);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    waitlistRef.current?.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }

  return (
    <main>
      <HomeownerHero onLockRate={goToWaitlist} />
      <FoundingRateSection onLockRate={() => goToWaitlist()} />
      <HomeownerFeatures />
      <HomeownerWaitlistForm
        sectionRef={waitlistRef}
        emailPrefill={emailPrefill}
        focusToken={focusToken}
      />
    </main>
  );
}
