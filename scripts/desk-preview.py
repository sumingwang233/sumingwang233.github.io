"""Render the first visual checkpoint from canonical profile content; not a site build."""
from pathlib import Path
from html import escape as e
import yaml

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / '.local' / 'desk-preview'
OUT.mkdir(parents=True, exist_ok=True)
COPY = yaml.safe_load((ROOT / 'data/desk.yaml').read_text(encoding='utf-8'))

def frontmatter(path):
    return yaml.safe_load(path.read_text(encoding='utf-8').split('---', 2)[1])

def paragraph(text):
    return f'<p>{e(text)}</p>'

for lang in ('zh', 'en'):
    profile = yaml.safe_load((ROOT / f'data/{lang}/authors/me.yaml').read_text(encoding='utf-8'))
    copy = COPY[lang]
    home = 'https://sumingwang233.github.io/' + ('en/' if lang == 'en' else '')
    names = ('research', 'software', 'game', 'photos', 'blog', 'cv')
    links = ('research/', '#open-source', 'projects/dormitory-cooking/', 'photos/', 'blog/', 'cv/')
    objects = []
    for name, label, link in zip(names, copy['items'], links):
        insert = ''
        if name == 'photos':
            insert = '<img class="desk-real-photo" src="/assets/images/hobby-photography.jpg" alt="' + e(profile['hobbies'][0]['image_alt']) + '">'
        if name == 'software':
            insert = '<img class="desk-real-screen" src="/assets/images/gamelibrary.webp" alt="GameLibrary">'
        objects.append(f'<a class="desk-object desk-{name}" href="{home + link}" data-desk-dialog="desk-dialog-{name}"><span class="desk-object-art" aria-hidden="true"></span>{insert}<span class="desk-object-label">{e(label)}</span></a>')
    zh = lang == 'zh'
    cv_text, job_text = ('学术简历', '求职简历') if zh else ('Academic CV', 'Résumé')
    cv_url = 'https://sumingwang233.github.io/files/cv-' + lang + '.pdf'
    downloads = f'<a href="{cv_url}">{cv_text}</a><a href="https://sumingwang233.github.io/files/job-resume-public.pdf">{job_text}</a>'
    nav = [('研究' if zh else 'Research', 'research/'), ('作品' if zh else 'Projects', 'projects/'), ('博客' if zh else 'Blog', 'blog/')]
    nav_html = ''.join(f'<a class="desk-extra" href="{home + url}">{text}</a>' for text, url in nav)
    quote = profile['personal_statement']
    projects = ROOT / f'content/{lang}/projects'
    game = frontmatter(projects / 'dormitory-cooking/index.md')
    software = frontmatter(projects / 'gamelibrary/index.md')
    experience = frontmatter(ROOT / f'content/{lang}/experience.md')
    desk_project = next(item for item in experience['contributions'] if item['id'] == 'research-desk')
    education = profile['education'][0]
    bodies = {
        'research': ''.join(paragraph(p) for p in profile['bio'].split('\n\n')[:2]),
        'software': f'<h3>{e(software["title"])}</h3>' + paragraph(software['summary']) + f'<h3>{e(desk_project["title"])}</h3>' + paragraph(desk_project['text']),
        'game': f'<h3>{e(game["title"])}</h3>' + paragraph(game['summary']),
        'photos': paragraph(profile['hobbies'][0]['text']) + f'<img class="desk-dialog-photo" loading="lazy" src="/assets/images/hobby-photography.jpg" alt="{e(profile["hobbies"][0]["image_alt"])}" width="1600" height="1067">',
        'blog': paragraph(copy['blog_intro']),
        'cv': paragraph(education['title']) + paragraph(profile['role']) + ''.join(paragraph(item) for item in experience['other_experience']),
    }
    dialogs = []
    for name, label, link in zip(names, copy['items'], links):
        action_text = copy.get(name + '_details', copy['details'])
        actions = f'<a class="desk-detail-button" href="{e(home + link)}">{e(action_text)}<span aria-hidden="true">↗</span></a>'
        if name == 'cv':
            actions += downloads
        dialogs.append(f'''<dialog id="desk-dialog-{name}" class="desk-dialog" aria-labelledby="desk-dialog-title-{name}"><article class="desk-dialog-paper"><button class="desk-dialog-close" type="button" aria-label="{e(copy['close'])}" autofocus>×</button><h2 id="desk-dialog-title-{name}">{e(label)}</h2><div class="desk-dialog-copy">{bodies[name]}</div><div class="desk-dialog-actions">{actions}</div></article></dialog>''')
    html = f'''<!doctype html><html lang="{lang}"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>{e(profile['name']['display'])} · {'书桌构图预览' if zh else 'Desk composition preview'}</title><link rel="stylesheet" href="/assets/css/desk.css">
<body class="desk-preview"><nav class="desk-nav"><a class="desk-brand" href="{home}">王鑫 / Xin Wang</a>{nav_html}<a class="desk-lang" href="{'en' if zh else 'zh'}.html">{'English' if zh else '中文'}</a></nav>
<main><section class="desk" aria-label="{'我的书桌' if zh else 'My desk'}"><div class="desk-stage"><p class="desk-hint">{e(copy['hint'])}</p>
<section class="desk-intro"><div class="desk-paper-rule" aria-hidden="true"></div><img class="desk-portrait" src="/assets/images/portrait-lifestyle.jpg" alt="{e(profile['name']['display'])}"><h1>{'王鑫' if zh else 'Xin Wang'}<span class="desk-name">{'Xin Wang' if zh else '王鑫'}</span></h1><p class="desk-role">{e(profile['role'])}</p><p class="desk-motto">{e(profile['motto'])}</p><p class="desk-bio">{e(copy['intro'])}</p><div class="desk-downloads">{downloads}</div></section>
{''.join(objects)}<a class="desk-scroll" href="#below">{e(copy['scroll'])}<span aria-hidden="true">↓</span></a></div></section>
<section class="desk-following" id="below"><blockquote><strong>“{e(quote['quote'])}”</strong><cite>{e(quote['author'])}</cite></blockquote><p>{'此处衔接现有主页的教育、研究、作品与生活内容。' if zh else 'Education, research, projects and life continue below.'}</p></section></main>{''.join(dialogs)}<script src="/assets/js/desk.js" defer></script></html>'''
    (OUT / f'{lang}.html').write_text(html, encoding='utf-8')
print(OUT)
