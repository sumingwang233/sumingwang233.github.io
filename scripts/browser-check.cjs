/* Generate public PDFs and exercise the built site at the agreed viewports. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const site = path.join(root, '_site');
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
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const [lang, route] of [['zh', '/cv/'], ['en', '/en/cv/']]) {
      await page.goto(base + route);
      await page.evaluate(() => document.fonts.ready);
      await page.pdf({ path: path.join(site, 'files', `cv-${lang}.pdf`), format: 'A4', printBackground: false, preferCSSPageSize: true, displayHeaderFooter: false });
    }
    for (const route of ['/', '/en/', '/cv/', '/en/cv/']) {
      for (const width of [320, 375, 414, 768, 1280, 1440, 1920]) {
        await page.setViewportSize({ width, height: width === 1280 ? 800 : 900 });
        await page.goto(base + route);
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(() => Promise.all([...document.images].map(image => { image.loading = 'eager'; return image.decode(); })));
        const result = await page.evaluate(() => {
          const wrapped = [...document.querySelectorAll('.main-nav a, .contact-links a, .footer-academic a, .cv-tools a, .cv-tools button, .language-link')].filter(a => {
            const range = document.createRange(); range.selectNodeContents(a);
            return new Set([...range.getClientRects()].map(r => Math.round(r.y))).size > 1;
          }).map(a => a.textContent);
          const clipped = [...document.querySelectorAll('h1,h2,h3,p,li,img')].filter(e => { if (e.closest('.hobbies-track') || e.matches('.portrait img')) return false; const r = e.getBoundingClientRect(); return r.x < -1 || r.right > innerWidth + 1; }).map(e => e.textContent.slice(0,50));
          return { overflow: document.documentElement.scrollWidth > innerWidth, wrapped, clipped, images: [...document.images].every(i => i.complete && i.naturalWidth > 0), serif: document.fonts.check('600 16px "Noto Serif SC"'), sans: document.fonts.check('400 16px "Noto Sans SC"') };
        });
        assert(!result.overflow && !result.wrapped.length && !result.clipped.length && result.images && result.serif && result.sans, `${route} @ ${width}: ${JSON.stringify(result)}`);
        if (route === '/' || route === '/en/') {
          const lang = route === '/' ? 'zh' : 'en';
          if (width === 375 || width === 1440) {
            await page.screenshot({ path: path.join(root, '.local', 'previews', `${lang}-${width}.png`), fullPage: true });
            await page.screenshot({ path: path.join(root, '.local', 'previews', `${lang}-${width}-fold.png`) });
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
    assert.equal(await page.locator('.contact-links a').count(), 3);
    assert.equal(await page.locator('.contact-links a[download]').first().innerText(), '学术简历');
    assert.equal(await page.locator('.contact-links a').last().innerText(), '求职简历');
    const jobResume = await page.request.get(base + '/files/job-resume-public.pdf');
    assert.equal(jobResume.status(), 200);
    assert((await jobResume.body()).subarray(0, 4).toString() === '%PDF');
    assert.equal(await page.locator('#campus .entry').count(), 2);
    assert.equal(await page.locator('#campus .entry-meta').count(), 0);
    assert.equal(await page.locator('#campus-photography h3').innerText(), '党宣部记者团 · 摄影部副部长');
    assert.deepEqual(await page.locator('.document > section').evaluateAll(nodes => nodes.slice(1, 4).map(n => n.id)), ['education', 'skills', 'research']);
    assert.equal(await page.locator('#honors li').nth(1).innerText(), '“外研社·国才杯·理解当代中国”英语组短视频大赛武汉大学校赛金奖');
    assert.equal(await page.locator('.closing-contact p').count(), 0);
    assert.equal(await page.locator('.closing-contact a').textContent(), '联系我： sumingwang@qq.com ↗');
    assert.equal(await page.locator('#cleft-qualitative-2026 > .entry-meta').innerText(), '2026.08.19');
    assert.equal(await page.locator('#projects-title').innerText(), '软件开发 ＆ AI 实践');
    assert.equal(await page.locator('h1#intro-title').innerText(), '武汉大学心理健康与教育中心（以下简称大心）马鑫主任助理');
    assert.equal(await page.locator('.intro-subtitle').innerText(), 'Be Water, my friend');
    assert.equal(await page.locator('.section-intro, #evaluation').count(), 0);
    assert.equal(await page.locator('#projects #angelalign-benchmark').count(), 1);
    assert.equal(await page.locator('#projects > .plain-list li').count(), 2);
    assert.equal(await page.locator('#whu-psychology .entry-meta').count(), 0);
    assert.equal(await page.locator('#whu-psychology h3').innerText(), '武汉大学 · 哲学学院 · 心理学本科');
    assert.equal(await page.locator('#whu-psychology .entry-points li').first().innerText(), 'GPA：3.81 / 4.00');
    assert(await page.locator('#whu-psychology .entry-points').evaluate(e => e.clientWidth > 800));
    assert.equal(await page.locator('#gamelibrary .architecture-node').count(), 6);
    assert.equal(await page.locator('#gamelibrary .feature').count(), 6);
    assert.equal(await page.locator('#dormitory-cooking .architecture-node').count(), 6);
    assert.equal(await page.locator('#dormitory-cooking .feature').count(), 6);
    assert.equal(await page.locator('#dormitory-cooking img').count(), 0);
    assert.equal(await page.locator('#undergraduate-thesis .mediation-flow .architecture-node').count(), 4);
    assert.equal(await page.locator('.project-figure img').count(), 1);
    assert.equal(await page.locator('.figure-pending').count(), 2);
    assert.equal(await page.locator('#angelalign-benchmark .mediation-flow .architecture-node').count(), 4);
    assert.equal(await page.locator('#angelalign-benchmark .evaluation-dimensions .architecture-node').count(), 3);
    assert.equal(await page.locator('#whu-psychology figure, #other figure').count(), 0);
    assert.equal(await page.locator('#other .plain-list li').count(), 2);
    assert.equal(await page.locator('.masthead-meta > span').innerText(), '个人学术主页');
    assert.equal(await page.locator('#emotion-self-verification figcaption').innerText(), '研究流程图 · 点击查看大图');
    assert(await page.locator('.portrait').evaluate(e => {
      const r = e.getBoundingClientRect();
      return r.width === r.height && r.width <= 144 && r.width >= 96 && getComputedStyle(e).borderRadius === '50%';
    }));
    assert(await page.locator('.portrait').evaluate(e => e.getBoundingClientRect().left > document.querySelector('.wordmark').getBoundingClientRect().right));
    assert.deepEqual(await page.locator('h1,h2,h3,p,li,dd').evaluateAll(nodes => nodes.map(n => n.textContent.trim()).filter(t => /[。.]$/.test(t))), []);
    const texture = await page.evaluate(() => getComputedStyle(document.body, '::before').backgroundImage);
    assert(texture.includes('book-paper-rough.png'));
    assert.equal((await page.request.get(texture.match(/url\("([^"]+)"\)/)[1])).status(), 200);
    assert.equal(await page.locator('.main-nav a').first().getAttribute('href'), '#research');
    assert.equal(await page.locator('#hobbies .hobby').count(), 4);
    assert.equal(await page.locator('.hobby').first().locator('figcaption p').innerText(), '东湖の秋');
    assert.equal(await page.locator('.hobbies-hint').innerText(), '左右滑动');
    await page.locator('.main-nav a[href="#hobbies"]').click();
    assert.equal(await page.locator('#hobbies-title').innerText(), '兴趣爱好');
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
    await page.goto(base + '/');
    for (const width of [375, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const id of ['emotion-self-verification', 'undergraduate-thesis']) {
        assert(await page.locator('#' + id).evaluate((e, wide) => {
          const body = e.querySelector('.entry-body').getBoundingClientRect(), figure = e.querySelector('figure').getBoundingClientRect();
          return wide ? Math.abs(body.top - figure.top) < 2 && (body.right <= figure.left || figure.right <= body.left) : figure.top >= body.bottom;
        }, width >= 960), `${id}: incorrect side-by-side/stacked layout at ${width}`);
      }
    }
    await page.locator('.language-link').click();
    assert(new URL(page.url()).pathname === '/en/');
    assert.equal(await page.locator('.contact-links a[download]').first().innerText(), 'Academic CV');
    assert.equal(await page.locator('.contact-links a').last().innerText(), 'Job resume (Chinese)');
    assert.equal(await page.locator('#projects-title').innerText(), 'Software development & AI practice');
    assert.equal(await page.locator('.intro-subtitle').innerText(), 'Be Water, my friend');
    assert.equal(await page.locator('#projects #angelalign-benchmark').count(), 1);
    assert.deepEqual(await page.locator('h1,h2,h3,p,li,dd').evaluateAll(nodes => nodes.map(n => n.textContent.trim()).filter(t => /[。.]$/.test(t))), []);
    for (const lang of ['zh', 'en']) {
      const response = await page.request.get(`${base}/files/cv-${lang}.pdf`);
      assert.equal(response.status(), 200);
      assert((await response.body()).subarray(0,4).toString() === '%PDF');
    }
    assert.deepEqual(errors, []);
    console.log('PASS: 28 viewport checks, laptop fold, self-hosted fonts, images, keyboard navigation, reduced motion, language switch, two public PDFs');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error.message); server.close(); process.exitCode = 1; });
