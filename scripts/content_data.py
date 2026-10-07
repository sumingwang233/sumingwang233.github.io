"""Read Hugo Markdown/YAML; JSON output is a disposable test input, never a source."""
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parents[1]
LOCALIZED = {'title', 'organization', 'supervisor', 'period', 'status', 'text', 'image_alt', 'image_caption', 'role', 'scope', 'bridge', 'detail', 'criteria', 'bullets', 'summary'}

def frontmatter(path):
    text = path.read_text('utf8')
    assert text.startswith('---\n'), f'{path.name}: missing YAML front matter'
    _, metadata, body = text.split('---', 2)
    return yaml.safe_load(metadata), body.strip()

def combine(zh, en, key=''):
    if key in LOCALIZED:
        return {'zh': zh, 'en': en}
    if isinstance(zh, dict):
        assert set(zh) == set(en), f'Bilingual field mismatch: {key}'
        return {k: combine(v, en[k], k) for k, v in zh.items()}
    if isinstance(zh, list):
        assert len(zh) == len(en), f'Bilingual list length: {key}'
        if key in {'model', 'dimensions'}:
            return [({'zh': a, 'en': b} if isinstance(a, str) else {'zh': a['title'], 'en': b['title'], 'detail': {'zh': a['detail'], 'en': b['detail']}}) for a, b in zip(zh, en)]
        return [combine(a, b) for a, b in zip(zh, en)]
    assert zh == en, f'Shared field mismatch: {key}'
    return zh

def load_profile():
    authors = {lang: yaml.safe_load((ROOT / f'data/{lang}/authors/me.yaml').read_text('utf8')) for lang in ['zh', 'en']}
    result = {'schema_version': 1, 'updated': authors['zh']['updated'], 'contact': authors['zh']['contact']}
    assert authors['zh']['contact'] == authors['en']['contact']
    result['person'] = {key: {lang: authors[lang][source] for lang in authors} for key, source in [('role', 'role'), ('intro', 'bio'), ('lead', 'motto'), ('tagline', 'tagline')]}
    result['person']['name'] = {lang: authors[lang]['name']['display'] for lang in authors}
    result['personal_statement'] = {lang: authors[lang]['personal_statement'] for lang in authors}
    for key in ['education', 'skills', 'hobbies', 'academic_interests']:
        result[key] = combine(authors['zh'][key], authors['en'][key], key)
    for section, groups in [('research', ['research']), ('projects', ['projects', 'evaluation']), ('publications', ['publications'])]:
        for group in groups:
            result[group] = []
        for path in sorted((ROOT / f'content/zh/{section}').glob('*/index.md'), key=lambda p: frontmatter(p)[0]['weight']):
            zh, _ = frontmatter(path)
            en, _ = frontmatter(ROOT / 'content/en' / path.relative_to(ROOT / 'content/zh'))
            if section == 'publications':
                zh['venue'] = zh.pop('publication')['name']
                en['venue'] = en.pop('publication')['name']
            else:
                zh['bullets'], en['bullets'] = zh.pop('highlights'), en.pop('highlights')
                if 'source_url' in zh:
                    zh['url'], en['url'] = zh.pop('source_url'), en.pop('source_url')
            if section == 'publications':
                assert {k: v for k, v in zh.items() if k != 'status'} == {k: v for k, v in en.items() if k != 'status'}
                item = {**zh, 'status': {'zh': zh['status'], 'en': en['status']}}
            else:
                item = combine(zh, en)
            group = 'evaluation' if item['id'] == 'angelalign-benchmark' else section
            result[group].append(item)
    experience = {lang: frontmatter(ROOT / f'content/{lang}/experience.md')[0] for lang in authors}
    result['campus_experience'] = combine(experience['zh']['campus'], experience['en']['campus'])
    result['contributions'] = combine(experience['zh']['contributions'], experience['en']['contributions'])
    for group in ['training', 'honors', 'other_experience']:
        result[group] = {lang: experience[lang][group] for lang in authors}
    return result
