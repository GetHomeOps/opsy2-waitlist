function sources(src) {
  if (typeof src === "string") {
    return { jpg: src, webp: undefined };
  }
  return { jpg: src?.jpg, webp: src?.webp };
}

export function SectionBackground({
  src,
  webp,
  mobilePosition = "center center",
  tabletPosition,
  desktopPosition = "center center",
  overlayClassName = "",
  overlay,
  className = "",
  imageClassName = "",
  priority = false,
  children,
}) {
  const files = sources(src);
  const jpg = files.jpg;
  const webpSrc = webp || files.webp;
  const image = (
    <img
      src={jpg}
      alt=""
      className={`section-bg-image absolute inset-0 h-full w-full ${imageClassName}`}
      style={{
        "--bg-pos-mobile": mobilePosition,
        "--bg-pos-tablet": tabletPosition || mobilePosition,
        "--bg-pos-desktop": desktopPosition,
      }}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "low"}
      decoding="async"
    />
  );

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {webpSrc ? (
        <picture className="absolute inset-0 block h-full w-full">
          <source srcSet={webpSrc} type="image/webp" />
          {image}
        </picture>
      ) : (
        image
      )}
      {overlayClassName ? (
        <div className={`absolute inset-0 ${overlayClassName}`} aria-hidden="true" />
      ) : null}
      {overlay}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
