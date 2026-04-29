#!/bin/bash
# Generate high-quality PNG promo images from SVG sources
# Requires: rsvg-convert, imagemagick v7+ (magick)

set -e

ASSETS_DIR="$(dirname "$0")/../assets"
cd "$ASSETS_DIR"

# Prefer ImageMagick v7 `magick`; fall back to legacy `convert` if v7 missing.
if command -v magick >/dev/null 2>&1; then
  MAGICK="magick"
else
  MAGICK="convert"
fi

echo "Generating promo images..."

# Function to convert SVG to PNG with 2x supersampling
convert_svg() {
  local svg="$1"
  local width="$2"
  local height="$3"
  local png="${svg%.svg}.png"

  echo "  $svg -> $png"
  rsvg-convert -w $((width * 2)) -h $((height * 2)) "$svg" | \
    "$MAGICK" - -filter Lanczos -resize ${width}x${height} -quality 100 "$png"
}

# Main banners (1280x800)
convert_svg "promo-banner-1280x800.svg" 1280 800
convert_svg "promo-02-customizable-1280x800.svg" 1280 800
convert_svg "promo-03-privacy-1280x800.svg" 1280 800
convert_svg "promo-04-automation-1280x800.svg" 1280 800
convert_svg "promo-05-tab-control-1280x800.svg" 1280 800

# Marquee promo tile (1400x560) - Chrome Web Store spec
convert_svg "promo-marquee-1400x560.svg" 1400 560

# Small promo tile (440x280) - Chrome Web Store spec
convert_svg "promo-small-440x280.svg" 440 280

# Large promo (920x680) - non-store size, kept for social/web use
[ -f "promo-large-920x680.svg" ] && convert_svg "promo-large-920x680.svg" 920 680

echo "Done! Generated $(ls -1 *.png | wc -l) PNG files."
