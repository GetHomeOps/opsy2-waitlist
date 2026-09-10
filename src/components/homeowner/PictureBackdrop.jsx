export function PictureBackdrop({
  jpg,
  webp,
  width,
  height,
  position = "center center",
  sizes,
  priority = false,
  className = "",
}) {
  return (
    <picture>
      <source srcSet={webp} type="image/webp" sizes={sizes} />
      <img
        src={jpg}
        alt=""
        width={width}
        height={height}
        sizes={sizes}
        className={`absolute inset-0 h-full w-full object-cover ${className}`}
        style={{ objectPosition: position }}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
      />
    </picture>
  );
}
