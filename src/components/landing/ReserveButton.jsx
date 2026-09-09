const variants = {
  gold:
    "bg-gold text-forest-deep hover:bg-gold-light",
  forest:
    "bg-forest text-cream hover:bg-forest-mid",
};

export function ReserveButton({
  children,
  variant = "forest",
  className = "",
  href,
  onClick,
  type = "button",
}) {
  const classes = [
    "inline-flex cursor-pointer items-center justify-center rounded-full px-7 py-3 text-[0.95rem] font-semibold tracking-wide transition-[color,background-color,transform,box-shadow] duration-300 ease-out",
    "hover:brightness-[1.03] motion-safe:hover:scale-[1.03]",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-deep",
    variants[variant],
    className,
  ].join(" ");

  if (href) {
    return (
      <a href={href} className={classes} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick}>
      {children}
    </button>
  );
}
