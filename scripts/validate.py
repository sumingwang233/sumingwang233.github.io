"""Validate canonical Hugo facts, page projections, photographs and PDF privacy."""
import argparse
import copy
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import tempfile
import unicodedata
import zipfile
from urllib.parse import urlsplit, unquote

import pymupdf
from PIL import Image
from content_data import load_profile, frontmatter
from inspect_sources import extract

ROOT = Path(__file__).resolve().parents[1]
PHONE = re.compile(r'(?<!\d)(?:\+?86[\s-]*)?1[3-9](?:[\s-]*\d){9}(?!\d)')
EMAIL = re.compile(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}')

def public_text(text):
    assert not PHONE.search(text), 'A mobile phone number was found'
    for marker in ['@163.com', 'Lorem ipsum', 'DhtAFkwAAAAJ', 'YOUR_GOOGLE_SCHOLAR_ID', 'Alice Smith', 'Your Name']:
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
    assert set(profile['contact']) == {'email', 'github'}
    ids = []
    for group in ['education', 'research', 'projects', 'evaluation', 'skills', 'hobbies', 'campus_experience', 'academic_interests']:
        for item in profile[group]:
            ids.append(item['id'])
            for key in ['title', 'organization', 'supervisor', 'period', 'status', 'text', 'image_alt', 'image_caption']:
                if key in item:
                    assert set(item[key]) == {'zh', 'en'}, f'{item["id"]}: {key} missing translation'
            if 'bullets' in item:
                assert len(item['bullets']['zh']) == len(item['bullets']['en'])
            if 'image' in item:
                assert item['image'].startswith('/assets/images/')
                assert item['image_width'] > 0 and item['image_height'] > 0
            if 'photos' in item:
                assert 2 <= len(item['photos']) <= 4, 'A rotating theme needs 3–5 photos including its cover'
                assert len({item['image'], *(photo['image'] for photo in item['photos'])}) == len(item['photos']) + 1
                for photo in item['photos']:
                    assert photo['image'].startswith('/assets/images/')
                    assert photo.get('thumbnail', photo['image']).startswith('/assets/images/')
                    assert set(photo['image_alt']) == set(photo['text']) == {'zh', 'en'}
            if 'architecture' in item:
                arch = item['architecture']
                for node in arch['clients'] + [arch[k] for k in ['host', 'application', 'domain', 'infrastructure']]:
                    assert set(node['role']) == {'zh', 'en'}
                for feature in arch['features']:
                    assert set(feature['title']) == set(feature['detail']) == {'zh', 'en'}
                    assert feature['implementation']
            for node in item.get('model', []) + item.get('dimensions', []):
                assert {'zh', 'en'} <= set(node)
    for paper in profile['publications']:
        ids.append(paper['id'])
        assert re.fullmatch(r'10\.\d{4,9}/\S+', paper['doi'])
        assert paper['authors'].count(profile['person']['name']['en']) == 1
    assert len(ids) == len(set(ids)), 'Duplicate entry IDs'
    public_text(json.dumps(profile, ensure_ascii=False))

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls, self.text, self.ids = [], [], set()
    def handle_data(self, data):
        self.text.append(data)
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            assert attrs['id'] not in self.ids, f'Duplicate HTML ID: {attrs["id"]}'
            self.ids.add(attrs['id'])
        if tag in ['a', 'img', 'link', 'script']:
            self.urls.extend(attrs[key] for key in ['href', 'src'] if key in attrs)

def parsed(site, route):
    html = (site / route.lstrip('/') / 'index.html').read_text('utf8')
    public_text(html)
    assert '{%' not in html and '{{' not in html, 'Unrendered template'
    parser = Links()
    parser.feed(html)
    return parser, ' '.join(' '.join(parser.text).split())

def present(text, facts, route):
    for fact in facts:
        assert ' '.join(str(fact).replace('**', '').split()) in text, f'{route}: missing public content: {str(fact)[:70]}'

def entry_facts(item, lang, figure=False):
    facts = [item[key][lang] for key in ['title', 'organization', 'supervisor', 'period', 'text'] if key in item]
    facts += item.get('bullets', {}).get(lang, [])
    if figure:
        facts += [node[lang] for node in item.get('model', []) + item.get('dimensions', [])]
        facts += [node['detail'][lang] for node in item.get('model', []) if 'detail' in node]
        if 'architecture' in item:
            arch = item['architecture']
            facts += [arch['bridge'][lang]]
            facts += [node['role'][lang] for node in arch['clients'] + [arch[k] for k in ['host', 'application', 'domain', 'infrastructure']]]
            facts += [feature[key][lang] for feature in arch['features'] for key in ['title', 'detail']]
            facts += [feature['implementation'] for feature in arch['features']]
        if 'criteria' in item:
            facts.append(item['criteria'][lang])
    return facts

def check_site(site, profile):
    for lang, prefix in [('zh', ''), ('en', 'en/')]:
        home, text = parsed(site, prefix)
        present(text, [profile['person'][k][lang] for k in ['name', 'role', 'intro', 'lead']], prefix)
        present(text, profile['personal_statement'][lang].values(), prefix)
        for group in ['education', 'skills', 'academic_interests']:
            for item in profile[group]:
                present(text, entry_facts(item, lang), prefix)
        for item in profile['research'] + [profile['projects'][0], profile['evaluation'][0]]:
            present(text, [item['title'][lang], item['bullets'][lang][0]], prefix)
        for hobby in profile['hobbies']:
            present(text, [hobby['title'][lang], hobby['text'][lang]], prefix)
        _, cv = parsed(site, prefix + 'cv')
        for group in ['education', 'research', 'projects', 'evaluation', 'skills', 'campus_experience', 'academic_interests']:
            for item in profile[group]:
                present(cv, entry_facts(item, lang), prefix + 'cv')
        for group in ['honors', 'training', 'other_experience']:
            present(cv, profile[group][lang], prefix + 'cv')
        _, experience = parsed(site, prefix + 'experience')
        for item in profile['campus_experience']:
            present(experience, entry_facts(item, lang), prefix + 'experience')
        for group in ['honors', 'training', 'other_experience']:
            present(experience, profile[group][lang], prefix + 'experience')
        for account_route in ['account', 'admin', 'blog', 'blog/post']:
            parsed(site, prefix + account_route)
        assert 'id="site-account-config"' not in (site / prefix / 'cv/index.html').read_text('utf8')
        for group, section in [('research', 'research'), ('projects', 'projects'), ('evaluation', 'projects')]:
            for item in profile[group]:
                route = prefix + section + '/' + item['id']
                parser, detail = parsed(site, route)
                present(detail, entry_facts(item, lang, figure=True), route)
                if item.get('image'):
                    assert item['image'] in parser.urls
        for paper in profile['publications']:
            route = prefix + 'publications/' + paper['id']
            parser, detail = parsed(site, route)
            facts = [paper['title'], *paper['authors'], paper['venue'], paper['status'][lang]]
            present(detail, facts, route)
            present(cv, facts, prefix + 'cv')
            present(text, facts, prefix)
            assert f'https://doi.org/{paper["doi"]}' in parser.urls
            # Sequence, not mere membership, protects the approved author order.
            citation_html = (site / route / 'index.html').read_text('utf8')
            authors_html = re.search(r'<p class=["\']?authors["\']?>(.*?)</p>', citation_html).group(1)
            authors_text = re.sub('<[^>]+>', '', authors_html)
            positions = [authors_text.index(author) for author in paper['authors']]
            assert positions == sorted(positions)
        photos, _ = frontmatter(ROOT / f'content/{lang}/photos/_index.md')
        assert [len(g['photos']) for g in photos['groups']] == [4, 3, 3, 2]
        assert len(parsed(site, prefix + 'photos')[0].urls) >= 24
        with pymupdf.open(site / f'files/cv-{lang}.pdf') as pdf:
            assert len(pdf) == 2, f'{lang} CV must remain two pages'
            pdf_text = '\n'.join(page.get_text() for page in pdf)
            public_text(pdf_text)
            for fact in [profile['contact']['email'], '283', '100', '17', profile['publications'][0]['doi']]:
                assert fact in pdf_text, f'{lang} PDF: missing {fact}'
    for path in site.rglob('*.html'):
        public_text(path.read_text('utf8'))
        parser = Links(); parser.feed(path.read_text('utf8'))
        for url in parser.urls:
            parsed_url = urlsplit(url)
            if parsed_url.scheme or parsed_url.netloc:
                continue
            target = (site / unquote(parsed_url.path).lstrip('/')) if parsed_url.path.startswith('/') else path.parent / unquote(parsed_url.path)
            if not parsed_url.path:
                target = path
            if target.is_dir():
                target /= 'index.html'
            assert target.is_file(), f'{path.relative_to(site)}: missing local URL {url}'
            if parsed_url.fragment and target.suffix == '.html':
                ids = Links(); ids.feed(target.read_text('utf8'))
                assert unquote(parsed_url.fragment) in ids.ids, f'Missing anchor {url}'
    for path in site.rglob('*'):
        if path.is_file():
            assert path.suffix.lower() not in {'.docx', '.nvp', '.rw2', '.arw', '.dng', '.cr3', '.md', '.yaml', '.toml', '.sql', '.env'}, f'Private/source format in site: {path}'
            assert not {'.local', 'docs', '_data', 'supabase'} & set(path.relative_to(site).parts)
            if path.suffix.lower() in {'.js', '.html', '.json'}:
                assert not re.search(r'sb_secret_[A-Za-z0-9_-]+', path.read_text('utf8')), f'Secret Supabase key in site: {path}'
    for path in (site / 'assets/images/photography').glob('*.webp'):
        with Image.open(path) as im:
            assert not im.getexif() and not any(k in im.info for k in ['exif', 'xmp', 'comment', 'icc_profile']), f'Photo metadata: {path.name}'
            assert max(im.size) >= (1000 if 'thumb' in path.name else 2000)
    for path in (site / 'assets/images/hobbies').glob('*.webp'):
        with Image.open(path) as im:
            assert not im.getexif() and not any(k in im.info for k in ['exif', 'xmp', 'comment', 'icc_profile']), f'Photo metadata: {path.name}'
            assert max(im.size) == 1600
    check_resume_pdf(site / 'files/job-resume-public.pdf', profile['contact']['email'])

def self_check(profile):
    revised = copy.deepcopy(profile)
    revised['research'].append(copy.deepcopy(revised['research'][0]))
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
                archive.writestr('word/document.xml', f'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r>{bold}<w:t>{text}</w:t></w:r></w:p></w:body></w:document>')
        write('Experience A'); original = extract(path)
        write('Experience A', '<w:rPr><w:b/></w:rPr>')
        assert extract(path) == original
        write('Experience B')
        assert extract(path)['sha256'] != original['sha256']
    with tempfile.TemporaryDirectory() as folder:
        path = Path(folder) / 'resume.pdf'
        email = profile['contact']['email']
        for case in ['safe', 'phone', 'private-email', 'hidden-text', 'metadata', 'attachment', 'annotation', 'form', 'link', 'xmp', 'no-text', 'encrypted']:
            with pymupdf.open() as doc:
                page = doc.new_page()
                if case != 'no-text': page.insert_text((40, 40), email)
                if case == 'phone': page.insert_text((40, 60), '+86 138 0000 0000')
                elif case == 'private-email': page.insert_text((40, 60), 'private@example.org')
                elif case == 'hidden-text': page.insert_text((40, 60), 'private@example.org', render_mode=3)
                elif case == 'metadata': doc.set_metadata({'author': 'private@example.org'})
                elif case == 'attachment': doc.embfile_add('source.txt', b'private source')
                elif case == 'annotation': page.add_text_annot((40, 60), 'private@example.org')
                elif case == 'form':
                    widget = pymupdf.Widget(); widget.field_name = 'private-contact'; widget.field_type = pymupdf.PDF_WIDGET_TYPE_TEXT
                    widget.field_value = 'private@example.org'; widget.rect = pymupdf.Rect(40, 60, 200, 80); page.add_widget(widget)
                elif case == 'link': page.insert_link({'kind': pymupdf.LINK_URI, 'from': pymupdf.Rect(40, 40, 200, 60), 'uri': 'mailto:private@example.org'})
                elif case == 'xmp': doc.set_xml_metadata('<private>private@example.org</private>')
                options = {'encryption': pymupdf.PDF_ENCRYPT_AES_256, 'user_pw': 'test-password'} if case == 'encrypted' else {}
                doc.save(path, deflate=True, **options)
            try:
                check_resume_pdf(path, email)
            except AssertionError:
                assert case != 'safe'
            else:
                assert case == 'safe', f'Unsafe resume accepted: {case}'

if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('--site', type=Path); args = parser.parse_args()
    data = load_profile(); validate_profile(data); self_check(data)
    for folder in ['content', 'data', 'i18n']:
        for path in (ROOT / folder).rglob('*'):
            if path.suffix in {'.md', '.yaml'}: public_text(path.read_text('utf8'))
    check_resume_pdf(ROOT / 'files/job-resume-public.pdf', data['contact']['email'])
    (ROOT / '.local').mkdir(exist_ok=True)
    (ROOT / '.local/public-profile.json').write_text(json.dumps(data, ensure_ascii=False), 'utf8')
    if args.site: check_site(args.site, data)
    print('PASS: canonical bilingual content, duplicate checks and 12 PDF privacy cases' + ('; homepage/detail/CV completeness, links, two-page PDFs and metadata-free photography' if args.site else ''))
