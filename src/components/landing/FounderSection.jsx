import { backgroundFocus, backgrounds } from "../../config/backgrounds.js";
import { ReserveButton } from "./ReserveButton.jsx";
import { SectionBackground } from "./SectionBackground.jsx";

const story = [
  "Ten years in real estate — Metropolist, then Windermere, Icon, and Real — and a business that was 100% referral for all of them. No purchased leads. Just clients who came back and sent the people they loved.",
  "That decade taught me where a real estate business is actually built: not in the transaction, but in everything after it. The agents whose referrals compound are the ones who keep showing up after closing — and there's never been a tool that does that showing up for you.",
  "So I built one. When your deal goes mutual, you CC one address. On closing day, your client gets their entire home organized and answerable by text — a gift with your name on it, working in their pocket for years.",
  "I'm not looking for customers. I'm looking for partners — collaborative, relationship-based producers who genuinely care about their clients after the commission clears. If that's you, there's a founding spot with your name on it.",
];

export function FounderSection() {
  return (
    <section id="founder" aria-labelledby="founder-heading">
      <SectionBackground
        src={backgrounds.founder}
        mobilePosition={backgroundFocus.founder.mobile}
        tabletPosition={backgroundFocus.founder.tablet}
        desktopPosition={backgroundFocus.founder.desktop}
        className="bg-forest-deep lg:min-h-[860px]"
        imageClassName="saturate-[.8]"
        overlay={
          <>
            <div
              className="pointer-events-none absolute inset-0 bg-forest-deep/80 lg:hidden"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-forest-deep/95 via-forest-deep/80 to-forest-deep/55 lg:block"
              aria-hidden="true"
            />
          </>
        }
      >
        <div className="mx-auto grid w-full max-w-[1240px] grid-cols-1 items-center gap-10 px-6 py-16 md:px-10 md:py-20 lg:min-h-[860px] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-14 lg:px-16 xl:gap-16">
          <div className="rise-in order-2 max-w-[38rem] lg:order-1">
            <p className="text-[0.78rem] font-bold tracking-[0.28em] text-gold">
              MEET OUR FOUNDER
            </p>
            <h2
              id="founder-heading"
              className="mt-4 text-balance font-serif text-[clamp(2.2rem,4.6vw,3.6rem)] font-semibold leading-[1.08] text-cream"
            >
              Aloha — I&apos;m{" "}
              <em className="font-semibold italic text-gold">Kino Belden</em>
            </h2>

            <div className="mt-7 space-y-5 text-[0.98rem] leading-7 text-cream/90 md:text-[1.02rem] md:leading-8">
              {story.map((paragraph) => (
                <p key={paragraph.slice(0, 32)}>{paragraph}</p>
              ))}
            </div>

            <p className="mt-8 font-serif text-[clamp(1.4rem,2.6vw,2rem)] font-semibold italic leading-snug text-gold-light">
              Let&apos;s move home forward — together.
            </p>

            <ReserveButton
              href="#pricing"
              variant="gold"
              className="mt-8 px-6 py-3.5 text-[0.92rem] shadow-none sm:px-8 sm:text-[0.98rem]"
            >
              Reserve your founding spot
            </ReserveButton>
          </div>

          <figure className="order-1 mx-auto w-full max-w-[26rem] lg:order-2 lg:max-w-none">
            <div className="overflow-hidden rounded-[22px] ring-1 ring-cream/25 shadow-[0_18px_44px_rgba(12,28,23,0.45)]">
              <picture>
                <source
                  type="image/webp"
                  srcSet="/founder/founder-family-800.webp 800w, /founder/founder-family.webp 1440w"
                  sizes="(min-width: 1024px) 40vw, (min-width: 640px) 26rem, 90vw"
                />
                <img
                  src="/founder/founder-family.jpg"
                  srcSet="/founder/founder-family-800.jpg 800w, /founder/founder-family.jpg 1440w"
                  sizes="(min-width: 1024px) 40vw, (min-width: 640px) 26rem, 90vw"
                  alt="Kino Belden and his wife on the beach, laughing as they hold their two young daughters up in the air"
                  width={1440}
                  height={1413}
                  className="block h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </picture>
            </div>
            <figcaption className="mt-4 text-center text-[0.86rem] italic leading-6 text-cream/75 lg:text-left">
              Kino Belden, founder of Opsy, with his family.
            </figcaption>
          </figure>
        </div>
      </SectionBackground>
    </section>
  );
}
