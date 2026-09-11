import { BrandLogo } from "./BrandLogo.jsx";
import { LegalLink } from "../legal/LegalModal.jsx";

export function SiteFooter() {
  return (
    <footer className="mt-16 flex flex-col gap-8 border-t border-forest/10 pt-8 md:mt-20 md:flex-row md:items-end md:justify-between">
      <p className="text-[0.86rem] text-forest-deep/75">
        © 2026 HomeOps Inc. ·{" "}
        <LegalLink
          documentKey="founding"
          className="underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        >
          Founding Terms
        </LegalLink>{" "}
        ·{" "}
        <LegalLink
          documentKey="privacy"
          className="underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        >
          Privacy
        </LegalLink>{" "}
        ·{" "}
        <LegalLink
          documentKey="terms"
          className="underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        >
          Terms
        </LegalLink>
      </p>

      <BrandLogo className="w-[176px] self-start md:w-[176px] md:self-end" />
    </footer>
  );
}
