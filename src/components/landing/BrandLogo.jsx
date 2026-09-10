import { Link } from "react-router-dom";

export function BrandLogo({ variant = "dark", className = "" }) {
  const src =
    variant === "light"
      ? "/branding/opsy-header-white.png"
      : "/branding/opsy-header.png";

  return (
    <Link to="/" aria-label="Opsy home">
      <img
        src={src}
        alt="Opsy, powered by HomeOps"
        className={`h-auto w-[236px] md:w-[280px] ${className}`}
      />
    </Link>
  );
}
