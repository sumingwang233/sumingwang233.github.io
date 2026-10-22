/* Optional check: node scripts/desk-dialog-check.cjs http://127.0.0.1:4174 / */
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({headless: true});
  const base = process.argv[2] || 'http://127.0.0.1:4174';
  const url = new URL(process.argv[3] || '/.local/desk-preview/zh.html', base).href;
  try {
    const page = await browser.newPage({viewport: {width: 390, height: 844}});
    await page.addInitScript(() => sessionStorage.setItem('site-access', 'visitor'));
    await page.route('https://*.supabase.co/**', route => route.fulfill({json: [], headers: {'access-control-allow-origin': '*'}}));
    await page.goto(url);
    for (const name of ['research', 'software', 'game', 'photos', 'blog', 'cv']) {
      const link = page.locator(`.desk-${name}`);
      const id = `desk-dialog-${name}`;
      await link.locator('.desk-object-label').click();
      assert.equal(await page.locator('dialog[open]').count(), 1);
      assert.equal(await page.locator(`#${id}`).isVisible(), true);
      assert.equal(await page.locator(`#${id} .desk-detail-button`).getAttribute('href'), await link.getAttribute('href'));
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('dialog[open]').count(), 0);
      assert.equal(await link.evaluate(el => el === document.activeElement), true);
    }
    await page.locator('.desk-blog').click();
    await page.locator('#desk-dialog-blog .desk-dialog-close').click();
    assert.equal(await page.locator('dialog[open]').count(), 0);
    await page.setViewportSize({width: 1440, height: 1000});
    await page.locator('.desk-blog').click();
    await page.mouse.click(2, 2);
    assert.equal(await page.locator('dialog[open]').count(), 0);
    await page.locator('.desk-software').click();
    const softwareTarget = await page.locator('#desk-dialog-software .desk-detail-button').getAttribute('href');
    if (softwareTarget.startsWith('#')) {
      await page.locator('#desk-dialog-software .desk-detail-button').click();
      assert.equal(await page.locator('dialog[open]').count(), 0);
      assert.equal(new URL(page.url()).hash, softwareTarget);
    } else await page.keyboard.press('Escape');
    const context = await browser.newContext({javaScriptEnabled: false});
    const fallback = await context.newPage();
    await fallback.goto(url);
    assert.equal(await fallback.locator('a[data-desk-dialog][href]').count(), 6);
    assert.equal(await fallback.locator('dialog:visible').count(), 0);
    console.log('PASS: six dialogs, detail targets, Escape, close button, backdrop, focus return and no-JS links');
  } finally { await browser.close(); }
})();
