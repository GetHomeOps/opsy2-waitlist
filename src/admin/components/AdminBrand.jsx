export function AdminBrand({ compact = false, titleClassName = "" }) {
  const logo = (
    <img
      src="/branding/opsy-header.png"
      alt="Opsy, powered by HomeOps"
      className={compact ? "h-8 w-auto" : "h-auto w-full max-w-[200px]"}
    />
  );

  if (compact) {
    return (
      <div className="flex min-w-0 items-center gap-2.5">
        {logo}
        <span
          className={`truncate font-serif text-lg font-semibold text-forest ${titleClassName}`}
        >
          Admin Portal
        </span>
      </div>
    );
  }

  return (
    <div>
      {logo}
      <p
        className={`mt-3 font-serif text-[1.35rem] font-semibold tracking-tight text-forest ${titleClassName}`}
      >
        Admin Portal
      </p>
    </div>
  );
}
