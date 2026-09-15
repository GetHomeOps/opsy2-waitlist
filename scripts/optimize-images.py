#!/usr/bin/env python3
"""Compress landing photos to WebP + smaller JPEG/PNG fallbacks."""

from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1] / "public"


def load(path):
    image = Image.open(path)
    image = ImageOps.exif_transpose(image)
    return image


def fit(image, max_width):
    if image.width <= max_width:
        return image
    height = round(image.height * (max_width / image.width))
    return image.resize((max_width, height), Image.Resampling.LANCZOS)


def save_jpeg(image, path, quality=78):
    rgb = image.convert("RGB")
    rgb.save(path, format="JPEG", quality=quality, optimize=True, progressive=True)


def save_webp(image, path, quality=72):
    has_alpha = image.mode in {"RGBA", "LA"} or "transparency" in image.info
    converted = image.convert("RGBA" if has_alpha else "RGB")
    converted.save(path, format="WEBP", quality=quality, method=6)


def write_photo(source, dest_stem, widths):
    image = load(source)
    results = {}
    for width in widths:
        sized = fit(image, width)
        suffix = "" if width == max(widths) else f"-{width}"
        jpg = dest_stem.parent / f"{dest_stem.name}{suffix}.jpg"
        webp = dest_stem.parent / f"{dest_stem.name}{suffix}.webp"
        save_jpeg(sized, jpg)
        save_webp(sized, webp)
        results[width] = (sized.size, jpg.stat().st_size, webp.stat().st_size)
        print(
            f"{webp.relative_to(ROOT.parent)} {sized.size[0]}x{sized.size[1]} "
            f"jpg={jpg.stat().st_size/1024:.0f}KB webp={webp.stat().st_size/1024:.0f}KB"
        )
    return results


def write_transparent(source, dest_webp, max_width, quality=80):
    image = fit(load(source), max_width)
    save_webp(image, dest_webp, quality=quality)
    print(
        f"{dest_webp.relative_to(ROOT.parent)} {image.size[0]}x{image.size[1]} "
        f"webp={dest_webp.stat().st_size/1024:.0f}KB"
    )
    return image.size


def main():
    photos = [
        (ROOT / "homeowner/homeowner-hero-left.jpg", ROOT / "homeowner/homeowner-hero-left", (800, 1600)),
        (ROOT / "homeowner/homeowner-hero-aerial.jpg", ROOT / "homeowner/homeowner-hero-aerial", (800, 1600)),
        (ROOT / "homeowner/homeowner-pricing-background.jpg", ROOT / "homeowner/homeowner-pricing-background", (800, 1600)),
        (ROOT / "homeowner/homeowner-features-background.jpg", ROOT / "homeowner/homeowner-features-background", (800, 1600)),
        (ROOT / "founder/founder-family.jpg", ROOT / "founder/founder-family", (800, 1440)),
    ]
    for source, stem, widths in photos:
        write_photo(source, stem, widths)

    backgrounds = [
        ("hero", 1448),
        ("how-it-works", 1448),
        ("pricing", 1448),
        ("guarantee", 1448),
        # Dense foliage barely responds to quality cuts, so the founder backdrop
        # is capped narrower instead. It only ever shows under a heavy scrim.
        ("founder", 1200),
        ("faq", 1448),
    ]
    for name, width in backgrounds:
        source = ROOT / "backgrounds" / f"{name}.jpg"
        write_photo(source, ROOT / "backgrounds" / name, (width,))

    write_transparent(
        ROOT / "homeowner/homeowner-phone-hero-tilted.png",
        ROOT / "homeowner/homeowner-phone-hero-tilted.webp",
        900,
    )
    write_transparent(
        ROOT / "branding/phone-mockup.png",
        ROOT / "branding/phone-mockup.webp",
        600,
    )


if __name__ == "__main__":
    main()
