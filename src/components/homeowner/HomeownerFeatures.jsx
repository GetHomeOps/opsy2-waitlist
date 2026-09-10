import { homeownerAssets, homeownerFeatures } from "../../config/homeowner.js";
import { PictureBackdrop } from "./PictureBackdrop.jsx";
import { Reveal } from "./Reveal.jsx";

export function HomeownerFeatures() {
  return (
    <section
      aria-labelledby="homeowner-features-heading"
      className="relative overflow-hidden bg-ho-forest"
    >
      <PictureBackdrop
        {...homeownerAssets.features}
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-[#243627]/78" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-[1240px] px-6 py-24 md:px-10 md:py-28 lg:px-16 lg:py-32">
        <Reveal>
          <h2
            id="homeowner-features-heading"
            className="max-w-[18ch] font-serif text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-[1.08] text-white"
          >
            One number in your phone. Your whole home behind it.
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-5">
          {homeownerFeatures.map((item, index) => (
            <article
              key={item.title}
              className="ho-card-enter flex h-full min-h-[260px] flex-col rounded-[12px] bg-ho-cream px-6 py-8 md:min-h-[300px] md:px-7 md:py-9"
              style={{ animationDelay: `${120 + index * 80}ms` }}
            >
              <h3 className="font-serif text-[1.65rem] font-semibold leading-snug text-ho-forest md:text-[1.75rem]">
                {item.title}
              </h3>
              <p className="mt-4 text-[0.98rem] leading-7 text-[#3d4d44]">
                {item.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
