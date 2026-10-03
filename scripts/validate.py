"""Validate public data, rendered pages and the sanitized resume PDF."""
import argparse
import copy
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import tempfile
import unicodedata
import zipfile

import pymupdf

from inspect_sources import extract

ROOT = Path(__file__).resolve().parents[1]
PHONE = re.compile(r'(?<!\d)(?:\+?86[\s-]*)?1[3-9](?:[\s-]*\d){9}(?!\d)')
EMAIL = re.compile(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}')


def public_text(text):
    assert not PHONE.search(text), 'A mobile phone number was found'
    for marker in ['@163.com', 'Lorem ipsum', 'DhtAFkwAAAAJ', 'YOUR_GOOGLE_SCHOLAR_ID']:
        assert marker not in text, f'Private or template marker: {marker}'
    assert not re.search(r'(?<![A-Za-z])[A-Za-z]:[\\/](?!/)|/mnt/[a-z]/|/Users/|/home/', text), 'Local absolute path was found'


def check_resume_pdf(path, email):
    def inspect(text):
        text = unicodedata.normalize('NFKC', text)
        text = ''.join(char for char in text if unicodedata.category(char) != 'Cf')
        public_text(text)
        assert all(value.lower() == email.lower() for value in EMAIL.findall(text)), 'Resume PDF contains an unapproved email'

    with pymupdf.open(path) as doc:
        assert doc.is_pdf and not doc.is_encrypted and not doc.needs_pass, 'Resume PDF cannot be inspected'
        assert len(doc), 'Resume PDF is empty'
        text = '\n'.join(page.get_text() for page in doc)
        inspect(text)
        assert email in text, 'Resume PDF must have extractable text and the approved public email'
        assert not doc.embfile_count(), 'Resume PDF contains an embedded attachment'
        assert not doc.get_xml_metadata(), 'Resume PDF contains XMP metadata'
        for key, value in doc.metadata.items():
            if key not in {'format', 'encryption'}:
                assert not value, 'Resume PDF metadata must be cleared'
        for page in doc:
            assert not page.get_links(), 'Resume PDF contains a link'
            assert not list(page.annots() or []), 'Resume PDF contains an annotation or attached file'
            assert not list(page.widgets() or []), 'Resume PDF contains a form field'


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
        expected.append(profile['person']['name'][lang])
        if route in {'cv/index.html', 'en/cv/index.html'}:
            expected.extend([*profile['person']['name'].values(), profile['contact']['github'].removeprefix('https://')])
            assert profile['contact']['github'] in parser.urls, f'{route}: missing profile GitHub link'
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
    check_resume_pdf(site / 'files/job-resume-public.pdf', profile['contact']['email'])


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
    with tempfile.TemporaryDirectory() as folder:
        path = Path(folder) / 'resume.pdf'
        email = profile['contact']['email']
        for case in ['safe', 'phone', 'private-email', 'hidden-text', 'metadata', 'attachment', 'annotation', 'form', 'link', 'xmp', 'no-text', 'encrypted']:
            with pymupdf.open() as doc:
                page = doc.new_page()
                if case != 'no-text':
                    page.insert_text((40, 40), email)
                if case == 'phone':
                    page.insert_text((40, 60), '+86 138 0000 0000')
                elif case == 'private-email':
                    page.insert_text((40, 60), 'private@example.org')
                elif case == 'hidden-text':
                    page.insert_text((40, 60), 'private@example.org', render_mode=3)
                elif case == 'metadata':
                    doc.set_metadata({'author': 'private@example.org'})
                elif case == 'attachment':
                    doc.embfile_add('source.txt', b'private source')
                elif case == 'annotation':
                    page.add_text_annot((40, 60), 'private@example.org')
                elif case == 'form':
                    widget = pymupdf.Widget()
                    widget.field_name = 'private-contact'
                    widget.field_type = pymupdf.PDF_WIDGET_TYPE_TEXT
                    widget.field_value = 'private@example.org'
                    widget.rect = pymupdf.Rect(40, 60, 200, 80)
                    page.add_widget(widget)
                elif case == 'link':
                    page.insert_link({'kind': pymupdf.LINK_URI, 'from': pymupdf.Rect(40, 40, 200, 60), 'uri': 'mailto:private@example.org'})
                elif case == 'xmp':
                    doc.set_xml_metadata('<private>private@example.org</private>')
                options = {'encryption': pymupdf.PDF_ENCRYPT_AES_256, 'user_pw': 'test-password'} if case == 'encrypted' else {}
                doc.save(path, deflate=True, **options)
            try:
                check_resume_pdf(path, email)
            except AssertionError:
                assert case != 'safe', 'Safe resume was rejected'
            else:
                assert case == 'safe', f'Unsafe resume was accepted: {case}'


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--site', type=Path)
    args = parser.parse_args()
    data = json.loads((ROOT / '_data/profile.json').read_text('utf8'))
    validate_profile(data)
    self_check(data)
    check_resume_pdf(ROOT / 'files/job-resume-public.pdf', data['contact']['email'])
    if args.site:
        check_site(args.site, data)
    print('PASS: public profile, bilingual fields, duplicate detection, PDF privacy regression and source-change checks' + ('; generated links, HTML and deployed resume PDF' if args.site else ''))
