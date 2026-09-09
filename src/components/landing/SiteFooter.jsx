import { Link } from "react-router-dom";
import { BrandLogo } from "./BrandLogo.jsx";

export function SiteFooter() {
  return (
    <footer className="mt-16 flex flex-col gap-8 border-t border-forest/10 pt-8 md:mt-20 md:flex-row md:items-end md:justify-between">
      <p className="text-[0.86rem] text-forest-deep/75">
        © 2026 HomeOps Inc. ·{" "}
        {/* TODO: replace with Founding Terms route when available */}
        <a
          href="#"
          className="underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        >
          Founding Terms
        </a>{" "}
        ·{" "}
        {/* TODO: replace with Privacy route when available */}
        <a
          href="#"
          className="underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        >
          Privacy
        </a>{" "}
        ·{" "}
        {/* TODO: replace with Terms route when available */}
        <a
          href="#"
          className="underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        >
          Terms
        </a>{" "}
        ·{" "}
        <Link
          to="/admin/login"
          className="underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        >
          Log in
        </Link>
      </p>

      <BrandLogo className="w-[176px] self-start md:w-[176px] md:self-end" />
    </footer>
  );
}
