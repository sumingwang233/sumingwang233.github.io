"""Small public-content and build validation, using Python's standard library."""
import argparse
import copy
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import tempfile
import zipfile

from inspect_sources import extract

ROOT = Path(__file__).resolve().parents[1]
PHONE = re.compile(r'(?<!\d)(?:\+?86[\s-]*)?1[3-9](?:[\s-]*\d){9}(?!\d)')


def public_text(text):
    assert not PHONE.search(text), 'A mobile phone number was found'
    for marker in ['@163.com', 'Lorem ipsum', 'DhtAFkwAAAAJ', 'YOUR_GOOGLE_SCHOLAR_ID']:
        assert marker not in text, f'Private or template marker: {marker}'
    assert not re.search(r'(?<![A-Za-z])[A-Za-z]:[\\/](?!/)|/mnt/[a-z]/|/Users/|/home/', text), 'Local absolute path was found'


def validate_profile(profile):
    assert profile['schema_version'] == 1
    assert set(profile['contact']) == {'email', 'github'}, 'Only approved contact fields are allowed'
    ids = []
    for group in ['education', 'research', 'projects', 'evaluation', 'skills', 'hobbies', 'campus_experience']:
        for item in profile[group]:
            ids.append(item['id'])
            assert set(item['title']) == {'zh', 'en'}
            if 'bullets' in item:
                assert set(item['bullets']) == {'zh', 'en'}
                assert len(item['bullets']['zh']) == len(item['bullets']['en'])
            if 'image' in item:
                assert item['image'].startswith('/assets/images/')
                assert item['image_width'] > 0 and item['image_height'] > 0
            if 'diagram' in item:
                assert item['diagram'] in {'gamelibrary', 'game', 'serial-mediation', 'evaluation'}
            if 'architecture' in item:
                arch = item['architecture']
                assert set(arch['scope']) == {'zh', 'en'}
                assert set(arch['bridge']) == {'zh', 'en'}
                for node in arch['clients'] + [arch[k] for k in ['host', 'application', 'domain', 'infrastructure']]:
                    assert set(node['role']) == {'zh', 'en'}
                for feature in arch['features']:
                    assert set(feature['title']) == set(feature['detail']) == {'zh', 'en'}
                    assert feature['implementation']
            for node in item.get('model', []) + item.get('dimensions', []):
                assert {'zh', 'en'} <= set(node), f'{item["id"]}: figure node missing translation'
                if 'detail' in node:
                    assert set(node['detail']) == {'zh', 'en'}
            for key in ['title', 'organization', 'period', 'status', 'text', 'image_alt', 'image_caption']:
                if key in item:
                    assert set(item[key]) == {'zh', 'en'}, f'{item["id"]}: {key} missing translation'
    for paper in profile['publications']:
        ids.append(paper['id'])
        assert re.fullmatch(r'10\.\d{4,9}/\S+', paper['doi'])
        assert paper['authors'].count(profile['person']['name']['en']) == 1
    assert len(ids) == len(set(ids)), 'Duplicate entry IDs'
    public_text(json.dumps(profile, ensure_ascii=False))


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []
        self.ids = set()
        self.text = []
    def handle_data(self, data):
        self.text.append(data)
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, f'Duplicate HTML ID: {attrs["id"]}'
            self.ids.add(attrs['id'])
        if tag in ['a', 'img', 'link']:
            self.urls.extend(attrs[key] for key in ['href', 'src'] if key in attrs)


def check_site(site, profile):
    for route in ['index.html', 'en/index.html', 'cv/index.html', 'en/cv/index.html']:
        html = (site / route).read_text('utf8')
        public_text(html)
        assert '{%' not in html and '{{' not in html, 'Unrendered Liquid'
        parser = Links()
        parser.feed(html)
        lang = 'en' if route.startswith('en/') else 'zh'
        rendered = ' '.join(' '.join(parser.text).split())
        expected = [profile['contact']['email'], profile['person']['role'][lang]]
        for group in ['education', 'research', 'projects', 'evaluation', 'skills']:
            for item in profile[group]:
                expected.extend(item[key][lang] for key in ['title', 'organization', 'period', 'status', 'text'] if key in item)
                expected.extend(item.get('bullets', {}).get(lang, []))
        for group in ['training', 'honors', 'other_experience']:
            expected.extend(profile[group][lang])
        for paper in profile['publications']:
            expected.extend([paper['title'], *paper['authors']])
            assert f'https://doi.org/{paper["doi"]}' in parser.urls, f'{route}: missing DOI link'
        if route in ['index.html', 'en/index.html']:
            for item in profile['campus_experience']:
                expected.extend([item['title'][lang], item['period'][lang], *item['bullets'][lang]])
            for hobby in profile['hobbies']:
                expected.extend([hobby['title'][lang], hobby['text'][lang]])
                assert hobby['image'] in parser.urls, f'{route}: missing hobby photograph'
            expected.extend(profile['person'][key][lang] for key in ['lead', 'intro', 'interests'])
            for item in profile['research'] + profile['projects'] + profile['education'] + profile['evaluation']:
                if 'image_caption' in item:
                    expected.append(item['image_caption'][lang])
                if 'model' in item:
                    expected.extend(node[lang] for node in item['model'])
                    expected.extend(node['detail'][lang] for node in item['model'] if 'detail' in node)
                expected.extend(node[lang] for node in item.get('dimensions', []))
                if 'criteria' in item:
                    expected.append(item['criteria'][lang])
                if 'architecture' in item:
                    arch = item['architecture']
                    expected.extend(node['role'][lang] for node in arch['clients'] + [arch[k] for k in ['host', 'application', 'domain', 'infrastructure']])
                    expected.append(arch['scope'][lang])
                    expected.append(arch['bridge'][lang])
                    expected.extend(feature[key][lang] for feature in arch['features'] for key in ['title', 'detail'])
                    expected.extend(feature['implementation'] for feature in arch['features'])
        for fact in expected:
            assert ' '.join(fact.split()) in rendered, f'{route}: missing public content: {fact[:50]}'
        for url in parser.urls:
            if url.startswith('#'):
                assert url[1:] in parser.ids, f'Missing anchor: {url}'
            elif url.startswith('/') and not url.startswith('//'):
                path = site / url.lstrip('/').split('#')[0]
                assert path.is_file() or (path / 'index.html').is_file(), f'Missing local URL: {url}'
    for path in site.rglob('*.html'):
        public_text(path.read_text('utf8'))
    for path in site.rglob('*'):
        if path.is_file():
            assert path.suffix.lower() not in {'.docx', '.nvp'}, f'Private source format in site: {path}'
            assert '.local' not in path.parts


def self_check(profile):
    revised = copy.deepcopy(profile)
    experience = copy.deepcopy(revised['research'][0])
    experience['id'] = 'validation-only-new-experience'
    revised['research'].append(experience)
    validate_profile(revised)
    revised['research'].append(experience)
    try:
        validate_profile(revised)
    except AssertionError:
        pass
    else:
        raise AssertionError('Duplicate detection failed')
    for unsafe in ['13800000000', '+86 138 0000 0000', 'D:\\private\\cv.docx']:
        try:
            public_text(unsafe)
        except AssertionError:
            pass
        else:
            raise AssertionError('Privacy detection failed')
    with tempfile.TemporaryDirectory() as folder:
        path = Path(folder) / 'source.docx'
        def write(text, bold=''):
            with zipfile.ZipFile(path, 'w') as archive:
                archive.writestr('word/document.xml', f'<w:document xmlns:w="{NAMESPACE}"><w:body><w:p><w:r>{bold}<w:t>{text}</w:t></w:r></w:p></w:body></w:document>')
        NAMESPACE = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
        write('Experience A')
        original = extract(path)
        write('Experience A', '<w:rPr><w:b/></w:rPr>')
        assert extract(path) == original, 'Formatting-only edit should not trigger an update'
        write('Experience B')
        assert extract(path)['sha256'] != original['sha256']


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--site', type=Path)
    args = parser.parse_args()
    data = json.loads((ROOT / '_data/profile.json').read_text('utf8'))
    validate_profile(data)
    self_check(data)
    if args.site:
        check_site(args.site, data)
    print('PASS: public profile, bilingual fields, duplicate detection, privacy and source-change checks' + ('; generated links and HTML' if args.site else ''))
