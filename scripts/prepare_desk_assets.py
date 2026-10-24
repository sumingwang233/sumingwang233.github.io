"""Encode approved generated desk art for delivery, without changing composition."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / 'assets/images/desk'
for name, widths in [('oak-v2', [960, 1600]), ('objects', [1280]), ('research-v3', [640]), ('game-v3', [640]), ('blog-v3', [640])]:
    with Image.open(ROOT / f'{name}.png') as source:
        for width in widths:
            image = source.copy()
            image.thumbnail((width, round(width * source.height / source.width)), Image.Resampling.LANCZOS)
            output = ROOT / f'{name}-{width}.webp'
            image.save(output, 'WEBP', quality=86, method=6)
            print(f'{output.name}: {output.stat().st_size // 1024} KB')
