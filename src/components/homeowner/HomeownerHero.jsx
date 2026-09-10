import { useState } from "react";
import { homeownerAssets } from "../../config/homeowner.js";
import { BrandLogo } from "../landing/BrandLogo.jsx";
import { PictureBackdrop } from "./PictureBackdrop.jsx";

export function HomeownerHero({ onLockRate }) {
  const [email, setEmail] = useState("");

  function onSubmit(event) {
    event.preventDefault();
    onLockRate(email.trim());
  }

  return (
    <section aria-label="Meet Opsy" className="bg-ho-forest">
      <div className="grid min-h-[100svh] grid-cols-1 lg:grid-cols-2">
        <div className="relative flex min-h-[auto] flex-col overflow-hidden px-4 py-8 sm:px-6 md:px-10 lg:min-h-[100svh] lg:px-12 xl:px-16">
          <PictureBackdrop
            {...homeownerAssets.heroLeft}
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ backgroundColor: "rgba(31, 88, 68, 0.78)" }}
            aria-hidden="true"
          />

          <div className="relative z-10">
            <BrandLogo variant="light" />
          </div>

          <div className="relative z-10 flex flex-1 flex-col justify-center py-14 text-white md:py-16 lg:py-8">
            <div className="rise-in max-w-[52rem]">
              <h1 className="font-serif text-[clamp(2.55rem,4.6vw,4.15rem)] font-semibold leading-[1.08] tracking-[-0.015em]">
                <span className="block md:whitespace-nowrap">
                  Meet Opsy —{" "}
                  <em className="whitespace-nowrap font-semibold italic text-gold">the keeper</em>
                </span>
                <em className="block font-semibold italic text-gold">of your home.</em>
              </h1>
              <p className="mt-6 max-w-[44rem] text-[1.15rem] leading-8 text-white/95 md:text-[1.38rem] md:leading-9">
                Manage your home, get answers, and connect with
                <br className="hidden sm:block" />{" "}
                trusted pros — all by text.
              </p>

              <form
                className="mt-8 flex w-full max-w-none flex-col gap-3 lg:max-w-[40rem] lg:flex-row lg:items-stretch"
                onSubmit={onSubmit}
              >
                <label className="sr-only" htmlFor="homeowner-hero-email">
                  Email
                </label>
                <input
                  id="homeowner-hero-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="box-border h-14 w-full min-w-0 rounded-full border-0 bg-white px-6 text-[1rem] text-ho-forest outline-none placeholder:text-ho-forest/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ho-gold sm:h-[3.65rem] lg:flex-1"
                />
                <button
                  type="submit"
                  className="inline-flex h-14 w-full shrink-0 items-center justify-center rounded-full bg-ho-gold px-7 text-[0.98rem] font-semibold tracking-wide text-ho-forest transition-[background-color,transform] duration-300 hover:bg-ho-gold-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-safe:hover:scale-[1.02] sm:h-[3.65rem] sm:px-8 lg:w-auto"
                >
                  Lock the founding rate
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="relative min-h-[72svh] overflow-hidden sm:min-h-[78svh] lg:min-h-[100svh]">
          <PictureBackdrop
            {...homeownerAssets.heroAerial}
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
          <img
            src={homeownerAssets.phoneTilted.src}
            alt="A text conversation with Opsy answering a homeowner question from an inspection report"
            width={homeownerAssets.phoneTilted.width}
            height={homeownerAssets.phoneTilted.height}
            className="phone-enter pointer-events-none absolute left-1/2 top-1/2 w-[min(118%,36rem)] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain sm:w-[min(88%,38rem)] lg:w-[clamp(26rem,41vw,42rem)]"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
}
