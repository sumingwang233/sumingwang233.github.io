"""Inspect local CV changes; never upload sources or publish the site."""
import argparse
import hashlib
import json
from pathlib import Path
import xml.etree.ElementTree as ET
import zipfile
import sys

ROOT = Path(__file__).resolve().parents[1]
STATE = ROOT / '.local' / 'reviewed-sources.json'
NAMESPACE = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}


def extract(path):
    if path.suffix.lower() == '.docx':
        with zipfile.ZipFile(path) as archive:
            tree = ET.fromstring(archive.read('word/document.xml'))
            paragraphs = [''.join(t.text or '' for t in p.findall('.//w:t', NAMESPACE)).strip()
                          for p in tree.findall('.//w:p', NAMESPACE)]
            links = []
            if 'word/_rels/document.xml.rels' in archive.namelist():
                rels = ET.fromstring(archive.read('word/_rels/document.xml.rels'))
                links = sorted(r.attrib['Target'] for r in rels if r.attrib.get('Type', '').endswith('/hyperlink'))
            text = '\n'.join(p for p in paragraphs if p) + '\n' + '\n'.join(links)
    elif path.suffix.lower() == '.md':
        text = path.read_text('utf8').strip()
    else:
        raise ValueError('Only explicitly supplied DOCX or Markdown sources are supported')
    if not text.strip():
        raise ValueError(f'Empty source: {path.name}')
    return {'sha256': hashlib.sha256(text.encode('utf8')).hexdigest(), 'text': text}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sources', nargs='*', type=Path)
    parser.add_argument('--record', action='store_true', help='Record baseline only after reviewing the public profile')
    args = parser.parse_args()
    paths = args.sources or [ROOT.parent / '学术CV' / name for name in ['中文_general.docx', 'EN_general.docx']]
    previous = json.loads(STATE.read_text('utf8')) if STATE.exists() else {}
    current = {str(p.resolve()): extract(p) for p in paths}
    changed = [Path(path).name for path, item in current.items()
               if previous.get(path, {}).get('sha256') != item['sha256']]
    print(json.dumps({'changed_sources': changed, 'source_count': len(paths), 'action': 'review_required' if changed else 'no_change'}, ensure_ascii=False))
    if args.record:
        STATE.parent.mkdir(parents=True, exist_ok=True)
        STATE.write_text(json.dumps(current, ensure_ascii=False, indent=2), 'utf8')
        print('Reviewed source baseline recorded locally; nothing uploaded.')


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf8')
    main()
