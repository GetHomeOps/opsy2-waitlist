import { Link } from "react-router-dom";
import { backgroundFocus, backgrounds } from "../../config/backgrounds.js";
import { BrandLogo } from "./BrandLogo.jsx";
import { PhoneMockup } from "./PhoneMockup.jsx";
import { ReserveButton } from "./ReserveButton.jsx";
import { SectionBackground } from "./SectionBackground.jsx";

export function HeroSection() {
  return (
    <section aria-label="Founding Transactions">
      <SectionBackground
        src={backgrounds.hero}
        mobilePosition={backgroundFocus.hero.mobile}
        tabletPosition={backgroundFocus.hero.tablet}
        desktopPosition={backgroundFocus.hero.desktop}
        className="min-h-[100svh] lg:min-h-[860px]"
        imageClassName="hero-people-crop"
        overlay={
          <div
            className="pointer-events-none absolute inset-0 bg-forest/50 lg:inset-y-0 lg:left-0 lg:w-[56%] lg:bg-transparent lg:bg-gradient-to-r lg:from-forest/40 lg:via-forest/10 lg:to-transparent"
            aria-hidden="true"
          />
        }
      >
        <Link
          to="/admin/login"
          className="absolute right-5 top-5 z-20 rounded-full border border-cream/80 bg-forest/55 px-4 py-1.5 text-[0.82rem] font-semibold tracking-wide text-cream backdrop-blur-[2px] transition-colors hover:bg-forest/75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold md:right-8 md:top-8 xl:right-10"
        >
          Log in
        </Link>
        <div className="mx-auto grid min-h-[100svh] w-full max-w-[1440px] grid-cols-1 items-center gap-8 px-6 py-8 md:px-10 lg:min-h-[860px] lg:grid-cols-2 lg:gap-6 lg:py-12 xl:px-16">
          <div className="rise-in max-w-[560px] pt-2 text-cream">
            <BrandLogo variant="light" />

            <h1 className="mt-10 font-serif text-[clamp(2.35rem,5.4vw,4.35rem)] font-semibold leading-[1.05] tracking-[-0.01em] md:mt-14">
              The last closing gift that
              <br />
              <em className="font-semibold italic text-cream">
                actually keeps working
              </em>
              <br />
              <em className="font-semibold italic text-cream">
                for you &amp; your clients
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
