export function PictureBackdrop({
  jpg,
  webp,
  jpgSrcSet,
  webpSrcSet,
  width,
  height,
  position = "center center",
  sizes,
  priority = false,
  loading,
  className = "",
}) {
  const loadMode = loading || (priority ? "eager" : "lazy");

  return (
    <picture>
      {webp || webpSrcSet ? (
        <source
          type="image/webp"
          srcSet={webpSrcSet || webp}
          sizes={sizes}
        />
      ) : null}
      {jpgSrcSet ? (
        <source type="image/jpeg" srcSet={jpgSrcSet} sizes={sizes} />
      ) : null}
      <img
        src={jpg}
        alt=""
        width={width}
        height={height}
        sizes={sizes}
        className={`absolute inset-0 h-full w-full object-cover ${className}`}
        style={{ objectPosition: position }}
        loading={loadMode}
        fetchPriority={priority ? "high" : "auto"}
        decoding="async"
      />
    </picture>
  );
}
