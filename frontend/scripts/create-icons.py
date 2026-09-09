"""Generate app icons from the supplied logo without stretching its proportions.
Run with Python + Pillow: python frontend/scripts/create-icons.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "frontend/public/icons"
source = Image.open(ROOT / "logo.png").convert("RGBA")
# Exclude near-invisible export noise when finding the artwork's bounds.
bounds = source.getchannel("A").point(lambda alpha: 255 if alpha > 16 else 0).getbbox()
left, top, right, bottom = bounds
source = source.crop((max(0, left - 24), max(0, top - 24), min(source.width, right + 24), min(source.height, bottom + 24)))
OUTPUT.mkdir(parents=True, exist_ok=True)

def icon(size, ratio):
    canvas = Image.new("RGBA", (size, size), "#F5E6CC")
    artwork = source.copy()
    artwork.thumbnail((round(size * ratio), round(size * ratio)), Image.Resampling.LANCZOS)
    canvas.alpha_composite(artwork, ((size - artwork.width)//2, (size - artwork.height)//2))
    return canvas.convert("RGB")

for size in (192, 512):
    for name, ratio in ((f"icon-{size}.png", .86), (f"icon-maskable-{size}.png", .62)):
        icon(size, ratio).save(OUTPUT / name, optimize=True)
        # New URLs prompt installed apps to refresh cached icons.
        icon(size, ratio).save(OUTPUT / name.replace(".png", "-v2.png"), optimize=True)
icon(180, .86).save(OUTPUT / "apple-touch-icon-v2.png", optimize=True)
icon(64, .86).save(OUTPUT / "favicon-v2.ico", sizes=[(16,16),(32,32),(48,48),(64,64)])
print("Generated app, maskable, Apple and favicon assets from logo.png")
