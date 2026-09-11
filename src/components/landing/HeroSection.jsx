import { backgroundFocus, backgrounds } from "../../config/backgrounds.js";
import { BrandLogo } from "./BrandLogo.jsx";
import { PhoneMockup } from "./PhoneMockup.jsx";
import { ReserveButton } from "./ReserveButton.jsx";
import { SectionBackground } from "./SectionBackground.jsx";

export function HeroSection() {
  return (
    <section aria-label="Founding Transactions">
      <link rel="preload" as="image" href={backgrounds.hero.webp} type="image/webp" />
      <SectionBackground
        src={backgrounds.hero}
        mobilePosition={backgroundFocus.hero.mobile}
        tabletPosition={backgroundFocus.hero.tablet}
        desktopPosition={backgroundFocus.hero.desktop}
        className="min-h-[100svh] lg:min-h-[860px]"
        imageClassName="hero-people-crop"
        priority
        overlay={
          <div
            className="pointer-events-none absolute inset-0 bg-forest/50 lg:inset-y-0 lg:left-0 lg:w-[56%] lg:bg-transparent lg:bg-gradient-to-r lg:from-forest/40 lg:via-forest/10 lg:to-transparent"
            aria-hidden="true"
          />
        }
      >
        <div className="mx-auto grid min-h-[100svh] w-full max-w-[1440px] grid-cols-1 items-center gap-8 px-6 py-8 md:px-10 lg:min-h-[860px] lg:grid-cols-2 lg:gap-6 lg:py-12 xl:px-16">
          <div className="rise-in max-w-[560px] pt-2 text-cream">
            <BrandLogo variant="light" />

            <h1 className="mt-10 font-serif text-[clamp(2.35rem,5.4vw,4.35rem)] font-semibold leading-[1.05] tracking-[-0.01em] md:mt-14">
              The closing gift
              <br />
              <span className="whitespace-nowrap">
                that{" "}
                <em className="font-semibold italic text-cream">
                  keeps working
                </em>
              </span>
              <br />
              <em className="font-semibold italic text-cream">
                for you &amp; your&nbsp;clients
              </em>
            </h1>

            <p className="mt-6 max-w-[440px] text-[0.98rem] leading-7 text-cream/95 md:text-[1.02rem] md:leading-8">
              CC one address when your deal goes mutual. On closing day,
              your client gets their entire home — documents, warranties,
              maintenance — organized and answerable by text and you stay
              connected without any of the work.
            </p>

            <ReserveButton
              href="#pricing"
              variant="gold"
              className="mt-8 max-w-full px-5 py-3.5 text-center text-[0.92rem] font-semibold leading-snug shadow-none sm:px-8 sm:text-[0.98rem]"
            >
              Reserve your Founding Transactions Today!
            </ReserveButton>
          </div>

          <div className="flex justify-center overflow-x-clip pb-6 lg:pb-0">
            <PhoneMockup />
          </div>
        </div>
      </SectionBackground>
    </section>
  );
}
