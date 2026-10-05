"""Refresh self-hosted subsets from the canonical Hugo content and labels."""
import json
from pathlib import Path
import urllib.request

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.local' / 'asset-cache'
CACHE.mkdir(parents=True, exist_ok=True)


def download(url, path):
    if not path.exists():
        with urllib.request.urlopen(url, timeout=90) as response:
            path.write_bytes(response.read())


def strings(value):
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return ''.join(strings(v) for v in value.values())
    if isinstance(value, list):
        return ''.join(strings(v) for v in value)
    return ''


text = ''.join(path.read_text('utf8') for folder in ['content', 'data', 'i18n'] for path in (ROOT / folder).rglob('*') if path.suffix in {'.md', '.yaml'})
text += ''.join(chr(n) for n in range(32, 127)) + '王 鑫Xin Wang·—–↗↓←：，。；（） /研究经历发表论文'
for slug, family, weight in [('notoserifsc', 'NotoSerifSC', 600), ('notosanssc', 'NotoSansSC', None)]:
    folder = f'https://raw.githubusercontent.com/google/fonts/main/ofl/{slug}'
    source = CACHE / f'{family}.ttf'
    download(f'{folder}/{family}%5Bwght%5D.ttf', source)
    license_path = ROOT / 'assets' / 'fonts' / f'{family}-OFL.txt'
    download(f'{folder}/OFL.txt', license_path)
    font = TTFont(source)
    if weight is not None:
        font = instantiateVariableFont(font, {'wght': weight}, inplace=True)
    options = subset.Options()
    options.flavor = 'woff2'
    options.layout_features = ['*']
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text=text)
    subsetter.subset(font)
    font.flavor = 'woff2'
    target = ROOT / 'assets' / 'fonts' / f'noto-{ "serif" if weight else "sans" }-sc.woff2'
    font.save(target)
    print(f'{target.name}: {target.stat().st_size // 1024} KB')
