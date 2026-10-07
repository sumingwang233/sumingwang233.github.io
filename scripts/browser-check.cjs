/* Generate public PDFs and exercise the built site at the agreed viewports. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const site = path.join(root, 'public');
const profile = JSON.parse(fs.readFileSync(path.join(root, '.local', 'public-profile.json'), 'utf8'));
async function revealForScreenshot(page) {
  // Exercise native scroll reveals so a full-page preview includes the whole page.
  await page.evaluate(async () => {
    for (let top = 0; top < document.body.scrollHeight; top += innerHeight * 0.8) {
      window.scrollTo({ top, behavior: 'instant' });
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForFunction(() => !document.querySelector('.reveal--pending'));
  await page.waitForTimeout(700);
}
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.woff2': 'font/woff2', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.pdf': 'application/pdf' };
const server = http.createServer((req, res) => {
  let file = path.resolve(site, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
  if (file !== site && !file.startsWith(site + path.sep)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end('Not found'); }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({ headless: true });
  try {
    fs.mkdirSync(path.join(site, 'files'), { recursive: true });
    fs.mkdirSync(path.join(root, '.local', 'previews'), { recursive: true });
    const page = await browser.newPage();
    // These existing content checks browse as a visitor. Account flows have their own checks.
    await page.addInitScript(() => sessionStorage.setItem('site-access', 'visitor'));
    await page.route('https://*.supabase.co/**', route => route.fulfill({ json: [], headers: { 'access-control-allow-origin': '*' } }));
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const [lang, route] of [['zh', '/cv/'], ['en', '/en/cv/']]) {
      await page.goto(base + route);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('.cv-heading h1').innerText(), `${profile.person.name[lang]} ${profile.person.name[lang === 'zh' ? 'en' : 'zh']}`);
      assert.equal(await page.locator('.cv-heading a').last().getAttribute('href'), profile.contact.github);
      assert.equal(await page.locator('.cv-heading a').last().innerText(), profile.contact.github.replace(/^https:\/\//, ''));
      for (const item of profile.contributions) {
        assert.equal(await page.locator('#projects').getByRole('link', { name: item.title[lang] }).getAttribute('href'), item.url);
      }
      await page.pdf({ path: path.join(site, 'files', `cv-${lang}.pdf`), format: 'A4', printBackground: false, preferCSSPageSize: true, displayHeaderFooter: false });
    }
    for (const route of ['/', '/en/', '/cv/', '/en/cv/']) {
      for (const width of [320, 375, 414, 768, 1280, 1440, 1920]) {
        await page.setViewportSize({ width, height: width === 1280 ? 800 : 900 });
        await page.goto(base + route);
        assert.equal(await page.locator('meta[name="author"]').getAttribute('content'), profile.person.name.en);
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => Promise.all([...document.images].map(image => { image.loading = 'eager'; return image.decode(); })));
        const result = await page.evaluate(() => {
          const wrapped = [...document.querySelectorAll('.main-nav a, .contact-links a, .footer-academic a, .cv-tools a, .cv-tools button, .language-link')].filter(a => {
            const range = document.createRange(); range.selectNodeContents(a);
            return new Set([...range.getClientRects()].map(r => Math.round(r.y))).size > 1;
          }).map(a => a.textContent);
          const clipped = [...document.querySelectorAll('h1,h2,h3,p,li,img')].filter(e => { if (e.closest('.hobbies-track') || e.matches('.portrait img, .banner-link img')) return false; const r = e.getBoundingClientRect(); return r.x < -1 || r.right > innerWidth + 1; }).map(e => e.textContent.slice(0,50));
          return { overflow: document.documentElement.scrollWidth > innerWidth, wrapped, clipped, images: [...document.images].every(i => i.complete && i.naturalWidth > 0), serif: document.fonts.check('600 16px "Noto Serif SC"'), sans: document.fonts.check('400 16px "Noto Sans SC"') };
        });
        assert(!result.overflow && !result.wrapped.length && !result.clipped.length && result.images && result.serif && result.sans, `${route} @ ${width}: ${JSON.stringify(result)}`);
        if (route === '/' || route === '/en/') {
          const lang = route === '/' ? 'zh' : 'en';
          assert.equal(await page.locator('.contact-links a').count(), 2);
          for (const anchor of ['education', 'skills', 'academic-interests', 'research', 'publications', 'projects', 'campus', 'campus-title', 'campus-photography', 'campus-club-design', 'honors', 'honors-title', 'other', 'other-title', 'hobbies']) {
            assert.equal(await page.locator('#' + anchor).count(), 1, `Missing legacy homepage anchor ${anchor}`);
          }
          assert.equal(await page.locator('#emotion-self-verification .research-status').count(), 0);
          assert.equal(await page.locator('#intro-title').innerText(), `${profile.person.name[lang]} ${profile.person.name[lang === 'zh' ? 'en' : 'zh']}`);
          assert.equal(await page.locator('.intro .role').innerText(), profile.person.role[lang]);
          assert.deepEqual(await page.locator('.intro-copy').allTextContents(), profile.person.intro[lang].split('\n\n'));
          assert.equal(await page.locator('#academic-interests li').count(), 3);
          assert.deepEqual(await page.locator('#academic-interests strong').allTextContents(), profile.academic_interests.map(item => item.title[lang] + (lang === 'zh' ? '：' : ': ')));
          assert.equal(await page.locator('#notes-title').innerText(), lang === 'zh' ? '我的博客' : 'My blog');
          assert.equal(await page.locator('.hobbies-intro').count(), 0);
          assert(!(await page.locator('.footer-academic').innerText()).includes(profile.updated));
          assert(await page.locator('.masthead-academic').evaluate(e => getComputedStyle(e, '::before').backgroundImage === getComputedStyle(document.body, '::before').backgroundImage));
          assert(await page.locator('.portrait').evaluate(e => {
            const portrait = e.getBoundingClientRect(), banner = e.closest('.home-banner').getBoundingClientRect();
            return Math.abs(portrait.width - portrait.height) < 1 && portrait.height / banner.height > 0.9 && portrait.height < banner.height && portrait.top >= banner.top && portrait.bottom <= banner.bottom;
          }));
          assert(await page.locator('#emotion-self-verification .entry-supervisor').evaluate(e => e.parentElement.classList.contains('entry-timing') && e.previousElementSibling.classList.contains('period') && Math.abs(e.getBoundingClientRect().top - e.previousElementSibling.getBoundingClientRect().top) < 2));
          if (width >= 1280 && lang === 'zh') {
            assert(await page.locator('#research .summary').evaluateAll(nodes => Math.max(...nodes.map(e => e.getBoundingClientRect().top)) - Math.min(...nodes.map(e => e.getBoundingClientRect().top)) < 1));
          }
          assert(await page.locator('.portrait').evaluate(e => Math.abs(e.getBoundingClientRect().left - document.querySelector('.document').getBoundingClientRect().left) < 1));
          assert(await page.locator('#gamelibrary .application-icon').evaluate(e => e.naturalWidth === 64 && e.getBoundingClientRect().height > 20 && e.getBoundingClientRect().height < 40));
          assert(await page.locator('.closing-contact > span').evaluate(e => !e.closest('a') && getComputedStyle(e).color === getComputedStyle(e.parentElement).color && getComputedStyle(e).textDecorationLine === 'none'));
          assert(await page.locator('.hobby-position').evaluate(e => e.getAttribute('aria-live') === 'polite' && getComputedStyle(e).clipPath === 'inset(50%)' && e.getBoundingClientRect().width === 1));
          if (width === 375 || width === 1440) {
            await revealForScreenshot(page);
            await page.screenshot({ path: path.join(root, '.local', 'previews', `${lang}-${width}.png`), fullPage: true });
            await page.screenshot({ path: path.join(root, '.local', 'previews', `${lang}-${width}-fold.png`) });
            if (width === 1440) {
              await page.locator('#academic-interests').screenshot({ path: path.join(root, '.local', 'previews', `${lang}-interests.png`) });
              await page.locator('#research').screenshot({ path: path.join(root, '.local', 'previews', `${lang}-research-overview.png`) });
              await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
              await page.locator('.records-menu').evaluate(e => { e.open = true; });
              await page.screenshot({ path: path.join(root, '.local', 'previews', `${lang}-records-menu.png`) });
              await page.locator('.records-menu').evaluate(e => { e.open = false; });
            }
          }
          if (width === 1280) assert(await page.locator('.contact-links').evaluate(e => e.getBoundingClientRect().bottom <= innerHeight), `${route}: primary contact does not fit laptop fold`);
        }
        await page.keyboard.press('Tab');
        assert.equal(await page.locator(':focus').innerText(), route.startsWith('/en') ? 'Skip to content' : '跳至正文');
        await page.keyboard.press('Enter');
        assert.equal(await page.locator(':focus').getAttribute('id'), 'content');
      }
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(base + '/');
    assert.equal(await page.locator('.contact-links a').count(), 2);
    assert.equal(await page.locator('.contact-links a[download]').first().innerText(), '学术简历');
    assert.equal(await page.locator('.contact-links a').last().innerText(), '求职简历');
    const jobResume = await page.request.get(base + '/files/job-resume-public.pdf');
    assert.equal(jobResume.status(), 200);
    assert((await jobResume.body()).subarray(0, 4).toString() === '%PDF');
    assert.deepEqual(await page.locator('.document > section').evaluateAll(nodes => nodes.slice(1, 5).map(n => n.id)), ['education', 'skills', 'academic-interests', 'research']);
    assert.equal(await page.locator('.intro-copy').count(), 3);
    assert.deepEqual(await page.locator('#academic-interests li').allTextContents(), profile.academic_interests.map(item => item.title.zh + '：' + item.text.zh));
    assert.equal(await page.locator('#skills-title').innerText(), '技能 ＆ 语言');
    assert.equal(await page.locator('#skills dd').first().innerText(), 'Python / PsychoPy 行为实验设计；E-Prime、MatLab；SPSS、Mplus；NVivo（质性分析）');
    assert.equal(await page.locator('.intro a[href^="mailto:"]').count(), 0);
    assert.equal(await page.locator('.closing-contact p').count(), 0);
    assert.equal(await page.locator('.closing-contact > span').textContent(), '联系我：');
    assert.equal(await page.locator('.closing-contact a').textContent(), 'sumingwang@qq.com ↗');
    assert.equal(await page.locator('#cleft-qualitative-2026 > .entry-meta').innerText(), '2026.08.19');
    assert.equal(await page.locator('#projects-title').innerText(), '作品');
    assert.equal(await page.locator('h1#intro-title').innerText(), '王鑫 Xin Wang');
    assert.equal(await page.locator('#emotion-self-verification .entry-supervisor').innerText(), '指导教师：马鑫');
    assert(await page.locator('#emotion-self-verification .entry-supervisor').evaluate(e => getComputedStyle(e).fontWeight === '700' && Math.abs(e.getBoundingClientRect().right - e.parentElement.getBoundingClientRect().right) < 1));
    assert.equal(await page.locator('#emotion-self-verification .research-status').count(), 0);
    assert.equal(await page.locator('.intro-subtitle').innerText(), 'Be Water, my friend');
    assert.equal(await page.locator('.section-intro, #evaluation').count(), 0);
    assert.equal(await page.locator('#projects #angelalign-benchmark').count(), 1);
    assert.equal(await page.locator('#projects .overview-entry').count(), 2);
    assert.equal(await page.locator('#research .overview-entry').count(), 3);
    assert.equal(await page.locator('#projects .architecture-figure').count(), 0);
    assert.equal(await page.locator('#whu-psychology .entry-meta').count(), 0);
    assert.equal(await page.locator('#whu-psychology h3').innerText(), '武汉大学 · 哲学学院 · 心理学本科');
    assert.equal(await page.locator('#whu-psychology .university-emblem').getAttribute('src'), '/assets/images/whu-emblem.png');
    assert(await page.locator('#whu-psychology .university-emblem').evaluate(e => Math.abs(e.getBoundingClientRect().height / parseFloat(getComputedStyle(e.parentElement).fontSize) - 1.3) < 0.02));
    assert.equal(await page.locator('#whu-psychology .entry-points li').first().innerText(), 'GPA：3.81 / 4.00');
    assert.equal(await page.locator('#whu-psychology .entry-points strong').innerText(), '3.81');
    assert.equal(await page.locator('.personal-statement strong').innerText(), '而我想找回这些失去的东西。');
    assert.equal(await page.locator('.wordmark span').innerText(), '主页');
    assert(await page.locator('#whu-psychology .entry-points').evaluate(e => e.clientWidth > 800));
    assert.equal(await page.locator('.project-figure img, .architecture-figure, .figure-pending').count(), 0);
    assert.equal(await page.locator('#whu-psychology figure, #other figure').count(), 0);
    assert.equal(await page.locator('.masthead-meta > span').count(), 0);
    assert.equal(await page.locator('.wordmark img').getAttribute('src'), '/assets/images/favicon-avatar.png');
    assert.equal(await page.locator('.banner-link img').getAttribute('src'), profile.hobbies.find(hobby => hobby.id === 'photography').image);
    assert.equal(await page.locator('.home-banner figcaption').count(), 0);
    assert.equal(await page.locator('.home-banner .portrait img').getAttribute('src'), '/assets/images/portrait-lifestyle.jpg');
    assert.equal(await page.locator('.masthead-academic').evaluate(e => getComputedStyle(e).position), 'sticky');
    assert.equal(await page.locator('.reveal--pending').count(), 0);
    assert(await page.locator('.portrait').evaluate(e => {
      const r = e.getBoundingClientRect();
      const banner = e.closest('.home-banner').getBoundingClientRect();
      return r.width === r.height && r.height / banner.height > 0.9 && getComputedStyle(e).borderRadius === '50%';
    }));
    assert(await page.locator('.portrait').evaluate(e => Math.abs(e.getBoundingClientRect().left - document.querySelector('.document').getBoundingClientRect().left) < 1));
    assert.deepEqual(await page.locator('h1,h2,h3').evaluateAll(nodes => nodes.map(n => n.textContent.trim()).filter(t => /[。.]$/.test(t))), []);
    const texture = await page.evaluate(() => getComputedStyle(document.body, '::before').backgroundImage);
    assert(texture.includes('book-paper-rough.png'));
    assert.equal((await page.request.get(texture.match(/url\("([^"]+)"\)/)[1])).status(), 200);
    assert.equal(await page.locator('.main-nav a').first().getAttribute('href'), '#research');
    assert.equal(await page.locator('#hobbies .hobby').count(), 4);
    assert.equal(await page.locator('.hobby').first().locator('figcaption p').innerText(), '东湖の秋');
    assert.equal(await page.locator('.hobbies-hint').count(), 0);
    await page.locator('#hobbies').scrollIntoViewIfNeeded();
    assert.equal(await page.locator('#hobbies-title').innerText(), '爱好特长');
    await page.locator('.hobbies-track').evaluate(e => { e.style.display = 'none'; window.dispatchEvent(new Event('resize')); });
    await page.locator('.hobbies-track').evaluate(e => { e.style.display = ''; window.dispatchEvent(new Event('resize')); });
    assert.equal(await page.locator('[aria-current="true"]').getAttribute('data-slide'), '0');
    for (const route of ['/', '/en/']) {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(base + route);
      await page.evaluate(() => document.fonts.ready);
      const target = page.locator('#emotion-self-verification');
      assert(await target.evaluate(e => e.classList.contains('reveal--pending')));
      assert.equal(await target.evaluate(e => getComputedStyle(e).opacity), '1');
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await target.evaluate(e => window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - 144, behavior: 'instant' }));
      await page.waitForFunction(() => !document.querySelector('#emotion-self-verification').classList.contains('reveal--pending'));
      const opacity = await target.evaluate(async e => {
        const animation = e.getAnimations().find(a => a.animationName === 'content-reveal');
        if (!animation) throw new Error('Scroll reveal did not create its CSS animation');
        await animation.ready;
        animation.pause();
        const timing = animation.effect.getTiming();
        animation.currentTime = timing.delay + timing.duration / 4;
        const value = Number(getComputedStyle(e).opacity);
        animation.finish();
        return value;
      });
      assert(opacity > 0 && opacity < 1, `${route}: missing intermediate reveal (${opacity})`);
      await page.waitForFunction(() => getComputedStyle(document.querySelector('#emotion-self-verification')).opacity === '1');
      await page.evaluate(() => window.scrollTo(0, 0));
      await target.scrollIntoViewIfNeeded();
      assert(!(await target.evaluate(e => e.classList.contains('reveal--pending'))), 'Content must reveal only once');
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForFunction(() => !document.querySelector('.reveal--pending'));
      assert.equal(await page.locator('.reveal--pending').count(), 0);
      await page.goto(base + route);
      assert.equal(await page.locator('.reveal--pending').count(), 0);
      assert.equal(await page.locator('.banner-link img').evaluate(e => getComputedStyle(e).transitionDuration), '0s');
    }
    // Navigation moves through intermediate positions and leaves the heading below the sticky bar.
    for (const route of ['/', '/en/']) {
      for (const width of [375, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.goto(base + route);
        const end = await page.locator('#research').evaluate(e => e.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) - parseFloat(getComputedStyle(e).scrollMarginTop));
        await page.locator('.about-menu summary').click();
        await page.locator('.main-nav a[href="#research"]').click();
        await page.waitForTimeout(80);
        const middle = await page.evaluate(() => scrollY);
        assert(middle > 0 && middle < end - 2, `${route} @ ${width}: missing smooth anchor travel`);
        await page.waitForFunction(top => Math.abs(scrollY - top) < 2, end);
        assert(await page.locator('#research').evaluate(e => e.getBoundingClientRect().top >= document.querySelector('.masthead-academic').getBoundingClientRect().bottom));
        assert(await page.locator('.main-nav > a').evaluateAll(links => links.every(e => getComputedStyle(e).borderTopStyle === 'solid' && e.getBoundingClientRect().height >= 44)));
        await page.emulateMedia({ reducedMotion: 'reduce' });
        assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto');
      }
    }
    // The same viewer handles research, hobby, banner and portrait images in place.
    for (const route of ['/', '/en/']) {
      for (const width of [375, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(base + route);
        const link = page.locator('.banner-link');
        const url = page.url(), pageCount = page.context().pages().length;
        await link.click();
        const viewer = page.locator('.image-viewer');
        await page.waitForFunction(() => document.querySelector('.image-viewer[open] img').naturalWidth > 0 && !document.querySelector('.image-viewer[open] img').hidden);
        assert(await viewer.isVisible());
        assert.equal(page.url(), url);
        assert.equal(page.context().pages().length, pageCount);
        assert.equal(await viewer.locator('img').getAttribute('src'), await link.evaluate(e => e.href));
        await viewer.locator('[data-zoom="1"]').click();
        assert.equal(await viewer.locator('output').innerText(), '150%');
        const stage = viewer.locator('.image-viewer-stage');
        const box = await stage.boundingBox();
        const beforeDrag = await viewer.locator('img').evaluate(e => e.style.transform);
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2, { steps: 3 });
        await page.mouse.up();
        assert.notEqual(await viewer.locator('img').evaluate(e => e.style.transform), beforeDrag);
        await page.mouse.wheel(0, -120);
        await page.waitForFunction(() => parseInt(document.querySelector('.image-viewer output').value, 10) > 150);
        await stage.focus();
        await page.keyboard.press('0');
        assert.equal(await viewer.locator('output').innerText(), '100%');
        await page.keyboard.press('+');
        assert.equal(await viewer.locator('output').innerText(), '150%');
        if (route === '/') await page.screenshot({ path: path.join(root, '.local', 'previews', `image-viewer-${width}.png`) });
        for (let i = 0; i < 10; i++) await page.keyboard.press('+');
        assert.equal(await viewer.locator('output').innerText(), '400%');
        assert(await viewer.locator('[data-zoom="1"]').isDisabled());
        for (let i = 0; i < 10; i++) await page.keyboard.press('-');
        assert.equal(await viewer.locator('output').innerText(), '100%');
        assert(await viewer.locator('[data-zoom="-1"]').isDisabled());
        await viewer.locator('[data-zoom="1"]').focus();
        await page.keyboard.press('Shift+Tab');
        assert.equal(await page.locator(':focus').getAttribute('class'), 'image-viewer-stage');
        for (let i = 0; i < 7; i++) {
          await page.keyboard.press('Tab');
          assert(await viewer.evaluate(e => e.contains(document.activeElement)), 'Image dialog must retain keyboard focus');
        }
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.documentElement.classList.contains('image-viewer-open'));
        assert.equal(await page.locator('.image-viewer[open]').count(), 0);
        assert.equal(await page.locator(':focus').getAttribute('href'), await link.getAttribute('href'));
        assert(!(await page.evaluate(() => document.documentElement.classList.contains('image-viewer-open'))));
        for (const selector of ['.hobby.is-current .figure-link', '.banner-link', '.portrait']) {
          await page.locator(selector).click();
          await page.waitForFunction(() => !document.querySelector('.image-viewer img').hidden);
          await viewer.locator('.image-viewer-close').click();
          assert.equal(page.url(), url);
        }
        await link.click();
        await page.evaluate(() => { document.querySelector('.image-viewer').close(); document.querySelector('.portrait').click(); });
        await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        assert(await viewer.evaluate(e => e.open && document.documentElement.classList.contains('image-viewer-open')));
        await viewer.locator('.image-viewer-close').click();
      }
    }
    const touch = await browser.newPage({ viewport: { width: 375, height: 900 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
    await touch.addInitScript(() => sessionStorage.setItem('site-access', 'visitor'));
    await touch.route('https://*.supabase.co/**', route => route.fulfill({ json: [], headers: { 'access-control-allow-origin': '*' } }));
    touch.on('pageerror', error => errors.push(error.message));
    await touch.goto(base + '/');
    await touch.locator('.banner-link').tap();
    await touch.waitForFunction(() => !document.querySelector('.image-viewer img').hidden);
    await touch.locator('.image-viewer [data-zoom="1"]').tap();
    const touchBox = await touch.locator('.image-viewer-stage').boundingBox();
    const touchBefore = await touch.locator('.image-viewer img').evaluate(e => e.style.transform);
    const cdp = await touch.context().newCDPSession(touch);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: touchBox.x + touchBox.width / 2, y: touchBox.y + touchBox.height / 2 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: touchBox.x + touchBox.width / 2 + 50, y: touchBox.y + touchBox.height / 2 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.notEqual(await touch.locator('.image-viewer img').evaluate(e => e.style.transform), touchBefore);
    await touch.locator('.image-viewer-close').tap();
    assert.equal(await touch.locator('.image-viewer[open]').count(), 0);
    await touch.close();
    const noScript = await browser.newContext({ javaScriptEnabled: false });
    for (const route of ['/', '/en/']) {
      const fallback = await noScript.newPage();
      await fallback.setViewportSize({ width: 375, height: 900 });
      await fallback.goto(base + route);
      assert.equal(await fallback.locator('.reveal--pending').count(), 0);
      assert(await fallback.locator('#research-title').isVisible());
      assert(await fallback.locator('.banner-link img').isVisible());
      assert.equal(await fallback.locator('.banner-link').getAttribute('target'), null);
      assert(await fallback.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await fallback.close();
    }
    await noScript.close();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const route of ['/', '/en/']) {
      for (const width of [375, 1280]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(base + route);
        const track = page.locator('.hobbies-track');
        const previous = page.locator('[data-direction="-1"]');
        const next = page.locator('[data-direction="1"]');
        const current = () => page.locator('.hobby-dots button[aria-current="true"]');
        assert(await previous.isDisabled());
        await next.click();
        await page.waitForFunction(() => document.querySelector('[data-slide="1"]').getAttribute('aria-current') === 'true');
        assert.equal(await current().getAttribute('data-slide'), '1');
        await page.locator('[data-slide="3"]').click();
        await page.waitForFunction(() => document.querySelector('[data-slide="3"]').getAttribute('aria-current') === 'true');
        assert(await next.isDisabled());
        await track.focus();
        await page.keyboard.press('Home');
        await page.waitForFunction(() => document.querySelector('[data-slide="0"]').getAttribute('aria-current') === 'true');
        await page.keyboard.press('ArrowRight');
        await page.waitForFunction(() => document.querySelector('[data-slide="1"]').getAttribute('aria-current') === 'true');
        assert(await page.locator('.hobby').nth(1).evaluate(slide => {
          const r = slide.getBoundingClientRect(), track = slide.parentElement.getBoundingClientRect();
          return Math.abs(r.left - track.left) < 2 && Math.abs(r.right - track.right) < 2 && !slide.inert;
        }), `${route} @ ${width}: selected slide is not fully visible`);
        assert.equal(await page.locator('.hobby[aria-hidden="false"]').count(), 1);
      }
    }
    // Normal-motion navigation must travel through intermediate positions and remain interruptible.
    for (const route of ['/', '/en/']) {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(base + route);
      await page.locator('[data-direction="1"]').click();
      await page.waitForTimeout(180);
      const intermediate = await page.locator('.hobbies-track').evaluate(e => e.scrollLeft / e.clientWidth);
      assert(intermediate > 0.1 && intermediate < 0.99, `${route}: missing animated travel`);
      await page.locator('[data-direction="1"]').click();
      await page.locator('[data-direction="-1"]').click();
      await page.waitForFunction(() => !document.querySelector('.hobbies-track').classList.contains('is-moving'));
      assert(await page.locator('.hobbies-track').evaluate(e => Math.abs(e.scrollLeft - e.clientWidth) < 2));
      assert.equal(await page.locator('[aria-current="true"]').getAttribute('data-slide'), '1');
      await page.locator('[data-slide="3"]').click();
      await page.setViewportSize({ width: 375, height: 900 });
      await page.waitForFunction(() => !document.querySelector('.hobbies-track').classList.contains('is-moving'));
      assert(await page.locator('.hobbies-track').evaluate(e => Math.abs(e.scrollLeft - 3 * e.clientWidth) < 2));
      await page.locator('[data-slide="0"]').click();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.waitForFunction(() => !document.querySelector('.hobbies-track').classList.contains('is-moving'));
      assert.equal(await page.locator('.hobbies-track').evaluate(e => e.scrollLeft), 0);
      assert.equal(await page.locator('.hobby').first().locator('img').evaluate(e => getComputedStyle(e).transitionDuration), '0s');
    }
    // Only the visible theme rotates. Pause, dialogs, reduced motion and a missing gallery stop it.
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(base + '/');
    await page.locator('#hobbies').scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    assert.deepEqual(await page.locator('.hobby').evaluateAll(slides => slides.map(slide => 1 + (slide.querySelector('template')?.content.querySelectorAll('a').length || 0))), [3, 1, 3, 3]);
    const photo = page.locator('.hobby').first().locator('img');
    const cover = await photo.getAttribute('src');
    await page.waitForFunction(src => document.querySelector('.hobby img').getAttribute('src') !== src, cover, { timeout: 10000 });
    assert.equal(await page.locator('.hobby-dots [aria-current="true"]').getAttribute('data-slide'), '0');
    await page.locator('[data-photo-toggle]').click();
    const pausedPhoto = await photo.getAttribute('src');
    await page.waitForTimeout(6500);
    assert.equal(await photo.getAttribute('src'), pausedPhoto);
    await page.locator('[data-photo-direction="1"]').click();
    await page.waitForFunction(src => document.querySelector('.hobby img').getAttribute('src') !== src, pausedPhoto);
    await page.locator('.hobby .figure-link').first().click();
    assert.equal(await page.locator('.image-viewer img').evaluate(e => e.src), await page.locator('.hobby .figure-link').first().evaluate(e => e.href));
    await page.keyboard.press('Escape');
    await page.locator('[data-slide="1"]').click();
    await page.waitForFunction(() => document.querySelector('[data-slide="1"]').getAttribute('aria-current') === 'true');
    assert(await page.locator('.photo-controls').isHidden());
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('[data-slide="0"]').click();
    assert(await page.locator('[data-photo-toggle]').isDisabled());
    await page.goto(base + '/');
    await page.locator('.language-link').click();
    assert(new URL(page.url()).pathname === '/en/');
    assert.equal(await page.locator('.contact-links a[download]').first().innerText(), 'Academic CV');
    assert.equal(await page.locator('.contact-links a').last().innerText(), 'Job resume (Chinese)');
    assert.equal(await page.locator('#projects-title').innerText(), 'Projects');
    assert.equal(await page.locator('.intro-subtitle').innerText(), 'Be Water, my friend');
    assert.equal(await page.locator('#projects #angelalign-benchmark').count(), 1);
    assert.deepEqual(await page.locator('h1,h2,h3').evaluateAll(nodes => nodes.map(n => n.textContent.trim()).filter(t => /[。.]$/.test(t))), []);
    for (const lang of ['zh', 'en']) {
      const response = await page.request.get(`${base}/files/cv-${lang}.pdf`);
      assert.equal(response.status(), 200);
      assert((await response.body()).subarray(0,4).toString() === '%PDF');
    }
    // Native Hugo routes retain the complete material in their detail pages.
    let addedViewports = 0;
    for (const prefix of ['', '/en']) {
      const routes = ['research', 'projects', 'publications', 'experience', 'records', 'notes', 'photos', 'journal'];
      routes.push(...profile.research.map(x => `research/${x.id}`), ...[...profile.projects, ...profile.evaluation].map(x => `projects/${x.id}`), ...profile.publications.map(x => `publications/${x.id}`));
      if (!prefix) routes.push('notes/self-concept-experiment', 'notes/gamelibrary-architecture');
      for (const route of routes) {
        for (const width of [375, 1280]) {
          await page.setViewportSize({ width, height: 900 });
          const response = await page.goto(`${base}${prefix}/${route}/`);
          assert.equal(response.status(), 200);
          await page.evaluate(async () => {
            await document.fonts.ready;
            await Promise.all([...document.images].map(im => { im.loading = 'eager'; return im.decode(); }));
          });
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${route} @ ${width}: overflow`);
          assert.equal(await page.locator('main h1').count(), 1);
          assert.equal(await page.locator('.language-link').count(), 1);
          assert(await page.locator('.language-link').getAttribute('href') !== page.url());
          if (['photos', 'research/emotion-self-verification', 'projects/gamelibrary'].includes(route)) {
            await page.screenshot({ path: path.join(root, '.local', 'previews', `${prefix ? 'en' : 'zh'}-${route.replaceAll('/', '-')}-${width}.png`), fullPage: true });
          }
          addedViewports++;
        }
      }
      await page.goto(`${base}${prefix}/projects/gamelibrary/`);
      assert.equal(await page.locator('.architecture-node').count(), 6);
      assert.equal(await page.locator('.feature').count(), 6);
      await page.locator('.language-link').click();
      assert.equal(new URL(page.url()).pathname, `${prefix ? '' : '/en'}/projects/gamelibrary/`);
      await page.goto(`${base}${prefix}/projects/dormitory-cooking/`);
      assert.equal(await page.locator('.feature').count(), 6);
      await page.goto(`${base}${prefix}/projects/angelalign-benchmark/`);
      assert.equal(await page.locator('.evaluation-dimensions .architecture-node').count(), 3);
      await page.goto(`${base}${prefix}/research/undergraduate-thesis/`);
      assert.equal(await page.locator('.mediation-flow .architecture-node').count(), 4);
      await page.goto(`${base}${prefix}/experience/`);
      assert.equal(await page.locator('#campus .entry').count(), 4);
      assert.equal(await page.locator('#campus .entry-meta').count(), 0);
      await page.goto(`${base}${prefix}/photos/`);
      assert.equal(await page.locator('.photo-grid figure').count(), 12);
      assert.equal(await page.locator('.photo-grid img[loading="lazy"]').count(), 12);
      await page.locator('.photo-grid .figure-link').first().click();
      await page.waitForFunction(() => !document.querySelector('.image-viewer img').hidden);
      await page.locator('.image-viewer [data-zoom="1"]').click();
      assert.equal(await page.locator('.image-viewer output').innerText(), '150%');
      await page.keyboard.press('Escape');
      await page.goto(`${base}${prefix}/research/emotion-self-verification/`);
      assert(await page.locator('.entry-supervisor').evaluate(e => getComputedStyle(e).fontWeight === '700' && Math.abs(e.getBoundingClientRect().right - e.parentElement.getBoundingClientRect().right) < 1));
      await page.locator('.project-figure .figure-link').click();
      await page.waitForFunction(() => !document.querySelector('.image-viewer img').hidden);
      assert((await page.locator('.image-viewer img').getAttribute('src')).endsWith('emotion-experiment.png'));
      await page.keyboard.press('Escape');
      await page.goto(`${base}${prefix}/journal/`);
      assert.equal(await page.locator('.empty-state').count(), 1);
      assert.equal(await page.locator('.overview-entry').count(), 0);
      await page.goto(`${base}${prefix}/`);
      await page.locator('.records-menu summary').click();
      assert.deepEqual(await page.locator('.records-menu > div a').allTextContents(), prefix ? ['All', 'Game psychology', 'Development diary', 'Photography', 'Essays'] : ['全部', '游戏心理学', '开发日记', '摄影', '随笔']);
      assert(await page.locator('.records-menu a[href$="/photos/"]').isVisible());
      await page.locator('.records-menu a[href$="/photos/"]').click();
      assert.equal(new URL(page.url()).pathname, `${prefix}/photos/`);
      await page.goto(`${base}${prefix}/experience/`);
      assert.equal(await page.locator('#campus').evaluate(e => getComputedStyle(e).borderTopWidth), '0px');
      assert.equal(await page.locator('#campus').evaluate(e => getComputedStyle(e).marginTop), '0px');
    }
    await page.goto(base + '/en/notes/');
    assert.equal(await page.locator('.note-preview a[lang="zh"]').count(), 2);
    assert((await page.locator('.note-preview .entry-meta').first().innerText()).includes('Chinese-language article'));
    await page.locator('.note-preview a').first().click();
    assert(new URL(page.url()).pathname.startsWith('/notes/'));
    const fallback = await browser.newContext({ javaScriptEnabled: false });
    const fallbackPage = await fallback.newPage({ viewport: { width: 375, height: 900 } });
    await fallbackPage.goto(base + '/photos/');
    await fallbackPage.locator('.photo-grid .figure-link').first().click();
    assert(new URL(fallbackPage.url()).pathname.endsWith('-full.webp'));
    await fallback.close();
    assert.deepEqual(errors, []);
    console.log(`PASS: 28 original + ${addedViewports} new viewports; complete routes, language/record menus, details, photos, original anchors, viewer, carousel, reduced motion, no-JS and CV PDFs`);
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error.stack || error.message); server.close(); process.exitCode = 1; });
