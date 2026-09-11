import { LegalLink } from "../legal/LegalModal.jsx";

export function HomeownerFooter() {
  return (
    <footer className="mt-16 border-t border-white/15 pt-6 text-center text-[0.86rem] leading-7 text-white/70 md:mt-20">
      <p>© 2026 HomeOps Inc.</p>
      <p className="mt-1">
        <LegalLink
          documentKey="founding"
          className="underline-offset-2 hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ho-gold"
        >
          Founding Terms
        </LegalLink>
        <span className="px-2 text-white/35">·</span>
        <LegalLink
          documentKey="privacy"
          className="underline-offset-2 hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ho-gold"
        >
          Privacy
        </LegalLink>
        <span className="px-2 text-white/35">·</span>
        <LegalLink
          documentKey="terms"
          className="underline-offset-2 hover:text-white hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ho-gold"
        >
          Terms
        </LegalLink>
      </p>
    </footer>
  );
}
