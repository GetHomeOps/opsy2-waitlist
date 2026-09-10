import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BrandLogo } from "./landing/BrandLogo.jsx";

export function AudienceChooser() {
  useEffect(() => {
    document.title = "Opsy";
    return () => {
      document.title = "Opsy | Founding Transactions";
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4 py-16">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="audience-heading"
        className="w-full max-w-[440px] rounded-[22px] border border-[#e6e0d4] bg-white p-8 shadow-[0_24px_50px_rgba(24,55,47,0.12)] sm:p-10"
      >
        <BrandLogo className="mx-auto" />
        <h1
          id="audience-heading"
          className="mt-8 text-center font-serif text-[2rem] font-semibold leading-[1.1] text-forest-deep"
        >
          Are you an agent or a homeowner?
        </h1>
        <p className="mt-3 text-center text-[0.98rem] leading-7 text-forest-deep/70">
          We&apos;ll take you to the right founding offer.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            to="/agents"
            className="inline-flex h-14 items-center justify-center rounded-full bg-forest px-8 text-[1rem] font-semibold text-cream transition-colors hover:bg-forest-mid focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            I&apos;m an agent
          </Link>
          <Link
            to="/homeowners"
            className="inline-flex h-14 items-center justify-center rounded-full bg-gold px-8 text-[1rem] font-semibold text-forest-deep transition-colors hover:bg-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-deep"
          >
            I&apos;m a homeowner
          </Link>
        </div>
      </div>
    </main>
  );
}
