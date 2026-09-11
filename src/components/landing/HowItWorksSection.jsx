import { backgroundFocus, backgrounds } from "../../config/backgrounds.js";
import { SectionBackground } from "./SectionBackground.jsx";

const steps = [
  {
    step: "STEP 1",
    title: "Sell — well, CC Opsy!",
    body: "At mutual acceptance, CC docs@heyopsy.com. That's the entire job. One address, one time, buyer's side only.",
  },
  {
    step: "STEP 2",
    title: "The Quiet Build",
    body: "As the inspection, disclosures, and timeline flow through the deal, Opsy builds your client's complete home record behind the scenes.",
  },
  {
    step: "STEP 3",
    title: "The Closing Audit",
    body: "Before handoff, Opsy checks the record against what a complete home file should contain — and flags anything missing while it's still easy to get and we add on our secret sauce to make sure you look good at closing!",
  },
  {
    step: "STEP 4",
    title: "The Gift",
    body: "On closing day, Opsy introduces itself to your client — whole house organized, answerable by text, in your name.",
  },
];

export function HowItWorksSection() {
  return (
    <section aria-labelledby="how-it-works-heading">
      <SectionBackground
        src={backgrounds.howItWorks}
        mobilePosition={backgroundFocus.howItWorks.mobile}
        tabletPosition={backgroundFocus.howItWorks.tablet}
        desktopPosition={backgroundFocus.howItWorks.desktop}
        className="min-h-[100svh] lg:min-h-[860px]"
        imageClassName="saturate-[.78] brightness-[1.06]"
        overlay={
          <div
            className="pointer-events-none absolute inset-0 bg-cream/40"
            aria-hidden="true"
          />
        }
      >
        <div className="mx-auto flex min-h-[100svh] w-full max-w-[1440px] flex-col justify-start px-6 py-12 md:px-10 lg:min-h-[860px] lg:px-16 lg:py-14">
          <div className="rise-in max-w-[38rem] rounded-2xl bg-cream/80 px-5 py-4 text-left shadow-[0_8px_20px_rgba(24,55,47,0.06)] backdrop-blur-[2px] md:rounded-none md:bg-transparent md:px-0 md:py-0 md:shadow-none md:backdrop-blur-none">
            <h2
              id="how-it-works-heading"
              className="font-serif text-[clamp(1.7rem,6.4vw,3.55rem)] font-bold leading-[1.14] text-forest-deep"
            >
              You do one thing.
              <br />
              We do the rest — quietly.
            </h2>
            <p className="mt-3 max-w-[30rem] font-sans text-[clamp(0.95rem,2.2vw,1.2rem)] italic leading-relaxed text-forest-deep/85">
              Your client never lifts a finger, and never sees it coming.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:mt-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {steps.map((item) => (
              <article
                key={item.step}
                className="card-shadow flex h-full flex-col rounded-[18px] bg-cream px-6 py-7 md:px-7 md:py-8"
              >
                <p className="text-[0.72rem] font-bold tracking-[0.28em] text-gold-deep">
                  {item.step}
                </p>
                <h3 className="mt-4 font-serif text-[1.55rem] font-bold leading-snug text-forest-deep">
                  {item.title}
                </h3>
                <p className="mt-4 text-[0.95rem] leading-7 text-charcoal">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </div>
      </SectionBackground>
    </section>
  );
}
