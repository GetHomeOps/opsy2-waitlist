export function SectionBackground({
  src,
  mobilePosition = "center center",
  tabletPosition,
  desktopPosition = "center center",
  overlayClassName = "",
  overlay,
  className = "",
  imageClassName = "",
  children,
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={src}
        alt=""
        className={`section-bg-image absolute inset-0 h-full w-full ${imageClassName}`}
        style={{
          "--bg-pos-mobile": mobilePosition,
          "--bg-pos-tablet": tabletPosition || mobilePosition,
          "--bg-pos-desktop": desktopPosition,
        }}
      />
      {overlayClassName ? (
        <div className={`absolute inset-0 ${overlayClassName}`} aria-hidden="true" />
      ) : null}
      {overlay}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
