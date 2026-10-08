/* Exercise the real bundled SDK with an isolated HTTP contract fixture, never production accounts. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..'), site = path.join(root, 'public');
const api = 'https://oiyqalcjbabcubxlhvsw.supabase.co';
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const users = new Map(), tokens = new Map(), posts = new Map(), drafts = new Map(), media = new Map();
let failSave = false, delaySave = false;
const makeUser = (email, admin = false) => ({ id: crypto.randomUUID(), email, password: 'a-valid-test-password', admin, confirmed: true });
users.set('owner@example.test', makeUser('owner@example.test', true));
users.set('member@example.test', makeUser('member@example.test'));
const authUser = user => ({ id: user.id, email: user.email, aud: 'authenticated', role: 'authenticated', email_confirmed_at: user.confirmed ? new Date().toISOString() : null, app_metadata: { provider: 'email' }, user_metadata: {}, identities: [], created_at: new Date().toISOString() });
const session = user => {
  const encode = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: user.id, email: user.email, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })}.fixture`;
  tokens.set(token, user);
  return { access_token: token, refresh_token: crypto.randomUUID(), token_type: 'bearer', expires_in: 3600, user: authUser(user) };
};
const server = http.createServer((req, res) => {
  let file = path.resolve(site, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
  if (file !== site && !file.startsWith(site + path.sep)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
  res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); fs.createReadStream(file).pipe(res);
});
async function fixture(route) {
  const req = route.request(), url = new URL(req.url()), method = req.method();
  const reply = (body, status = 200) => route.fulfill({ status, json: body, headers: { 'access-control-allow-origin': '*', 'access-control-expose-headers': 'X-Supabase-Api-Version', 'x-supabase-api-version': '2024-01-01' } });
  if (method === 'OPTIONS') return reply({});
  const user = tokens.get((req.headers().authorization || '').replace('Bearer ', ''));
  let body;
  try { body = req.postDataJSON(); } catch { body = {}; }
  if (url.pathname === '/auth/v1/signup') {
    const existing = users.get(body.email);
    const next = existing || { ...makeUser(body.email), password: body.password, confirmed: false };
    users.set(body.email, next); return reply(authUser(next));
  }
  if (url.pathname === '/auth/v1/token') {
    const next = users.get(body.email);
    if (!next || next.password !== body.password) return reply({ code: 'invalid_credentials', msg: 'Invalid login credentials' }, 400);
    if (!next.confirmed) return reply({ code: 'email_not_confirmed', msg: 'Email not confirmed' }, 400);
    return reply(session(next));
  }
  if (url.pathname === '/auth/v1/verify') {
    const next = users.get(body.email);
    if (!next || body.token !== '123456') return reply({ code: 'otp_expired', msg: 'Expired token' }, 403);
    next.confirmed = true; return reply(session(next));
  }
  if (url.pathname === '/auth/v1/user') {
    if (!user) return reply({ code: 'bad_jwt', msg: 'Invalid token' }, 401);
    if (method === 'PUT') user.password = body.password;
    return reply(authUser(user));
  }
  if (['/auth/v1/logout','/auth/v1/resend','/auth/v1/recover'].includes(url.pathname)) return reply({});
  if (url.pathname === '/rest/v1/rpc/is_site_admin') return reply(Boolean(user?.admin));
  if (url.pathname === '/rest/v1/rpc/save_blog_draft') {
    if (!user?.admin) return reply({ code: '42501' }, 403);
    if (failSave) return reply({ code: 'connection_failed' }, 503);
    if (delaySave) await new Promise(resolve => setTimeout(resolve, 600));
    const current = posts.get(body.post_id);
    if (!current || current.version !== body.expected_version || current.status !== 'published') return reply([]);
    const updated_at = new Date().toISOString(), item = {...current, version:current.version+1, updated_at};
    posts.set(item.id,item); drafts.set(item.id,{post_id:item.id, post_version:item.version, content:body.content, updated_at});
    return reply([item]);
  }
  if (url.pathname === '/rest/v1/blog_post_drafts') {
    if (!user?.admin) return reply([]);
    let items = [...drafts.values()];
    if (url.searchParams.has('post_id')) items = items.filter(item => item.post_id === url.searchParams.get('post_id').replace('eq.',''));
    const offset = Number(url.searchParams.get('offset') || 0), limit = Number(url.searchParams.get('limit') || 1000);
    return reply(items.slice(offset,offset+limit));
  }
  if (url.pathname === '/rest/v1/blog_posts') {
    const eqId = url.searchParams.get('id')?.replace('eq.', '');
    const version = Number(url.searchParams.get('version')?.replace('eq.', ''));
    if (method === 'GET') {
      let items = [...posts.values()].filter(post => user?.admin || post.status === 'published');
      if (eqId) items = items.filter(item => item.id === eqId);
      if (url.searchParams.has('source_path')) {
        const source = url.searchParams.get('source_path');
        items = items.filter(item => source.startsWith('in.(') ? source.slice(4,-1).split(',').map(value => value.replace(/^"|"$/g,'')).includes(item.source_path) : item.source_path === source.replace('eq.',''));
      }
      if (url.searchParams.has('status')) items = items.filter(item => item.status === url.searchParams.get('status').replace('eq.', ''));
      if (url.searchParams.has('category')) items = items.filter(item => item.category === url.searchParams.get('category').replace('eq.', ''));
      const order = url.searchParams.get('order') || '';
      items.sort((a,b) => order.startsWith('id') ? a.id.localeCompare(b.id) : (b.published_at || b.updated_at).localeCompare(a.published_at || a.updated_at));
      const offset = Number(url.searchParams.get('offset') || 0), limit = Number(url.searchParams.get('limit') || 1000);
      items = items.slice(offset, offset + limit);
      if (req.headers().accept?.includes('vnd.pgrst.object')) return items.length === 1 ? reply(items[0]) : reply({ code: 'PGRST116', message: '0 rows', details: 'The result contains 0 rows' }, 406);
      return reply(items);
    }
    if (!user?.admin) return reply({ code: '42501', message: 'Forbidden' }, 403);
    if (failSave) return reply({ code: 'connection_failed', message: 'Offline fixture' }, 503);
    if (delaySave) await new Promise(resolve => setTimeout(resolve, 600));
    const now = new Date().toISOString();
    if (method === 'POST') {
      if (body.source_path && [...posts.values()].some(item => item.source_path === body.source_path)) return reply({code:'23505'},409);
      const item = { source_path:null, body_style:{}, ...body, id: crypto.randomUUID(), author_id: user.id, version: 1, created_at: now, updated_at: now, published_at: body.status === 'published' ? body.published_at || now : null };
      posts.set(item.id, item); return reply(req.headers().accept?.includes('vnd.pgrst.object') ? item : [item], 201);
    }
    const current = posts.get(eqId);
    if (!current || current.version !== version) return reply([]);
    drafts.delete(eqId);
    if (method === 'DELETE') { posts.delete(eqId); return reply([{id:eqId}]); }
    const item = { ...current, ...body, version: current.version + 1, updated_at: now, published_at: current.published_at || (body.status === 'published' ? now : null) };
    posts.set(eqId, item); return reply([item]);
  }
  if (url.pathname.startsWith('/storage/v1/object/blog-media/') && method === 'POST') {
    if (!user?.admin) return reply({ error: 'Forbidden' }, 403);
    const name = decodeURIComponent(url.pathname.slice('/storage/v1/object/blog-media/'.length));
    const form = await new Response(req.postDataBuffer(), { headers: { 'content-type': req.headers()['content-type'] } }).formData();
    const uploaded = [...form.values()].find(value => typeof value !== 'string');
    const bytes = Buffer.from(await uploaded.arrayBuffer());
    assert.equal(bytes.subarray(0,4).toString(), 'RIFF'); assert.equal(bytes.subarray(8,12).toString(), 'WEBP');
    assert(!bytes.includes(Buffer.from('EXIF')) && !bytes.includes(Buffer.from('XMP ')), 'Export retains private metadata');
    assert(!name.includes('portrait') && name.endsWith('.webp'));
    media.set(name, bytes); return reply({ Key: 'blog-media/' + name, Id: crypto.randomUUID() }, 201);
  }
  if (url.pathname === '/storage/v1/object/sign/blog-media') return reply(body.paths.map(name => ({ path: name, signedURL: '/object/sign/blog-media/' + name + '?token=fixture' })));
  if (url.pathname.startsWith('/storage/v1/object/sign/blog-media/')) {
    const name = decodeURIComponent(url.pathname.slice('/storage/v1/object/sign/blog-media/'.length));
    return route.fulfill({ status: media.has(name) ? 200 : 404, contentType: 'image/webp', body: media.get(name) || Buffer.from('') });
  }
  throw new Error(`Unhandled SDK request: ${method} ${url.pathname}`);
}

(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const errors = [];
  const context = await browser.newContext();
  context.on('page', page => page.on('pageerror', error => errors.push(error.message)));
  await context.route(api + '/**', fixture);
  const page = await context.newPage();
  await page.clock.install();
  const login = async (target, email, password = 'a-valid-test-password') => {
    await target.goto(base + '/account/');
    await target.locator('#auth-form').waitFor({ state: 'visible' });
    await target.locator('[name=email]').fill(email); await target.locator('[name=password]').fill(password);
    await target.locator('#auth-submit').click();
  };
  try {
    fs.mkdirSync(path.join(root,'.local/previews'),{recursive:true});
    await page.goto(base + '/');
    await page.locator('#access-choice[open]').waitFor();
    // Chromium may focus browser chrome at wrap; background page controls must stay inert.
    for (let count=0; count<4; count++) { await page.keyboard.press('Tab'); assert(await page.evaluate(()=>document.activeElement === document.body || Boolean(document.activeElement.closest('#access-choice')))); }
    for (const width of [320,375,768,1304]) {
      await page.setViewportSize({width,height:880});
      assert(await page.locator('#access-choice').evaluate(e => e.scrollWidth <= e.clientWidth + 1));
    }
    await page.screenshot({path:path.join(root,'.local/previews/access-choice.png')});
    await page.locator('[data-visitor]').click();
    assert.equal(await page.evaluate(()=>sessionStorage.getItem('site-access')),'visitor');
    await page.reload(); assert.equal(await page.locator('#access-choice[open]').count(),0);
    await page.goto(base + '/account/');
    await page.locator('#auth-form').waitFor({state:'visible'});
    const supportsWebGL = await page.evaluate(() => {
      const canvas = document.createElement('canvas'), gl = canvas.getContext('webgl2');
      const supported = Boolean(gl);
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
      return supported;
    });
    if (supportsWebGL) {
      await page.locator('#login-scene[data-ready] canvas').waitFor({state:'visible'});
      // A translated scene must fit the actual free rectangle, not a fixed zoom/offset.
      const sceneChecks = await page.evaluate(async () => {
        const THREE = await import('/login-scene/lib/three.module.min.js');
        const {createCamera, fitCamera} = await import('/login-scene/src/core/camera.js');
        const {assetRoot, part} = await import('/login-scene/src/core/assetKit.js');
        const {INSTANCES} = await import('/login-scene/src/config/sceneLayout.js');
        const {create: createPetals} = await import('/login-scene/src/effects/petalFall.js');
        const bounds = new THREE.Box3(new THREE.Vector3(-10,0,-10), new THREE.Vector3(10,8,10));
        const results = [];
        for (const [viewport, frame] of [
          [{width:1304,height:880}, {left:24,top:92,width:682,height:630}],
          [{width:375,height:880}, {left:24,top:92,width:327,height:190}],
          [{width:900,height:550}, {left:24,top:92,width:340,height:340}],
        ]) {
          const camera = createCamera();
          fitCamera(camera,bounds,viewport,frame);
          for (const x of [bounds.min.x,bounds.max.x]) for (const y of [bounds.min.y,bounds.max.y]) for (const z of [bounds.min.z,bounds.max.z]) {
            const point = new THREE.Vector3(x,y,z).project(camera);
            const px=(point.x+1)*viewport.width/2, py=(1-point.y)*viewport.height/2;
            results.push(px>=frame.left && px<=frame.left+frame.width && py>=frame.top && py<=frame.top+frame.height && point.z>=-1 && point.z<=1);
          }
        }
        const root=assetRoot('regression','test');
        const solid=part(root,new THREE.BoxGeometry(2,4,2),'mat_wall_exterior','solid');
        const glass=part(root,new THREE.BoxGeometry(1,1,0.1),'mat_tram_window','glass');
        results.push(solid.castShadow && solid.receiveShadow && !glass.castShadow && !glass.material.depthWrite);
        const assets=new Map(INSTANCES.filter(i=>i.assetId.startsWith('nature_sakura_somei_yoshino') && i.visible).map(i=> {
          const tree=new THREE.Group(); tree.add(solid.clone()); tree.position.fromArray(i.position);
          return [i.instanceId,tree];
        }));
        const group=new THREE.Group(), petals=createPetals({group,sceneManager:{assets}});
        results.push(petals.sources.length>0 && petals.sources.every(source=>Math.abs(source.radius-1)<0.001));
        solid.geometry.dispose(); glass.geometry.dispose();
        group.traverse(object=>{object.geometry?.dispose(); object.material?.dispose();});
        return results;
      });
      assert(sceneChecks.every(Boolean),'Scene framing, glass depth or shadow/petal placement regressed');
      await page.screenshot({path:path.join(root,'.local/previews/login-scene.png')});
    }
    await page.locator('[data-auth-mode=signup]').click();
    assert.equal(await page.locator('.account-page .eyebrow').count(), 0);
    assert.equal(await page.locator('[data-auth-mode=verify]').count(), 0);
    assert.equal(await page.locator('[data-password-label]').innerText(), '请设置新密码');
    await page.locator('[name=password]').fill('aaaaaaaaaaaa');
    assert.equal(await page.locator('[data-password-strength] meter').evaluate(e => e.value), 1);
    await page.locator('[name=password]').fill('G8!vR2#kL7@mQ4$z');
    assert.equal(await page.locator('[data-password-strength] meter').evaluate(e => e.value), 3);
    await page.locator('[name=email]').fill('new-member@example.test'); await page.locator('[name=password]').fill('a-new-valid-test-password');
    await page.locator('[name=password_confirm]').fill('a-different-test-password');
    await page.locator('#auth-submit').click();
    assert(!users.has('new-member@example.test'), 'Mismatched passwords reached the signup API');
    assert.equal(await page.locator('[name=password_confirm]').evaluate(e => e.validationMessage), '两次输入的密码不一致');
    await page.locator('[name=password_confirm]').fill('a-new-valid-test-password');
    await page.locator('#auth-submit').click();
    await page.waitForFunction(()=>document.querySelector('#auth-message').textContent.includes('注册请求'));
    assert(users.has('new-member@example.test'));
    await page.locator('[name=code]').fill('999999'); await page.locator('#auth-submit').click();
    await page.waitForFunction(()=>document.querySelector('#auth-message').textContent.includes('失效'));
    await page.locator('[name=code]').fill('123456'); await page.locator('#auth-submit').click();
    await page.locator('#account-session').waitFor({state:'visible'});
    assert(await page.locator('[data-admin-link]').isHidden());
    await page.goto(base + '/admin/');
    await page.waitForFunction(()=>document.querySelector('#admin-message').textContent.includes('没有管理员权限'));
    assert(await page.locator('#writing-desk').isHidden());
    await page.goto(base + '/account/'); await page.locator('#account-session').waitFor({state:'visible'});
    await page.locator('[data-logout]').click(); await page.locator('#auth-form').waitFor({state:'visible'});
    await login(page,'owner@example.test','wrong-password');
    await page.waitForFunction(()=>document.querySelector('#auth-message').textContent.includes('不正确'));
    await login(page,'owner@example.test'); await page.locator('[data-admin-link]').waitFor({state:'visible'});
    await page.reload(); await page.locator('#account-session').waitFor({state:'visible'});
    await page.locator('[data-admin-link]').click(); await page.locator('#writing-desk').waitFor({state:'visible'});
    assert.equal(await page.locator('#admin-posts button').count(), 2, 'Original notes are missing from the writing desk');
    const input = name => page.locator(`#post-form [name=${name}]`);
    await input('category').selectOption('research');
    await input('psychology_topic').selectOption('game-psychology');
    await input('title').fill('测试草稿 <script>'); await input('excerpt').fill('Summary');
    await input('body_md').fill('## Heading\n\nA useful paragraph.\n\n<script>window.pwned = true</script>\n<img src=x onerror="window.pwned=true">\n[Unsafe](javascript:alert(1))');
    await page.locator('[data-save]').click(); await page.waitForFunction(()=>document.querySelector('#editor-message').textContent === '已保存');
    assert.equal(posts.size,1); const firstId = [...posts.keys()][0];
    assert.equal(posts.get(firstId).status,'draft');
    assert(posts.get(firstId).tags.includes('game-psychology'), 'The psychology topic was not saved with the draft');
    await page.locator('#post-preview').waitFor({state:'visible'});
    await input('font_size').fill('20'); await input('line_height').fill('2'); await input('letter_spacing').fill('1');
    await input('body_md').fill((await input('body_md').inputValue()) + '\n\n**Live Markdown**');
    await page.locator('[data-preview-body] strong').waitFor();
    assert.equal(await page.locator('[data-preview-body]').evaluate(e => getComputedStyle(e).fontSize), '20px');
    await page.clock.fastForward(31000);
    await page.waitForFunction(()=>document.querySelector('#save-state').textContent.startsWith('已保存'));
    assert.equal(posts.get(firstId).body_style.font_size,20);
    assert(posts.get(firstId).body_md.includes('Live Markdown'), 'Timer did not save the changed draft');
    assert.equal(await page.evaluate(()=>Boolean(window.pwned)),false);
    assert.equal(await page.locator('#post-preview script, #post-preview [onerror], #post-preview a[href^="javascript"]').count(),0);
    await page.goto(base + '/blog/');
    await page.waitForFunction(() => document.querySelector('[data-blog-message]').textContent === '');
    assert.equal(await page.locator(`[data-post-id="${firstId}"]`).count(),0, 'A private draft appeared in the archive');
    assert.equal(await page.locator('[data-blog-feed] article').count(),2, 'Static notes disappeared when no online posts were published');
    await page.goto(base + '/admin/'); await page.locator('#writing-desk').waitFor({state:'visible'});
    await page.locator(`#admin-posts button[data-id="${firstId}"]`).click();
    await page.waitForFunction(()=>document.querySelector('#post-form [name=title]').value.includes('测试草稿'));
    assert((await input('body_md').inputValue()).includes('A useful paragraph'));
    await input('tags').fill('one,two,three,four,five,six'); await page.locator('[data-save]').click();
    await page.waitForFunction(()=>document.querySelector('#editor-message').textContent.includes('最多 5'));
    await input('tags').fill('psychology,development');
    failSave=true; await input('title').fill('未保存的正文'); await page.locator('[data-save]').click();
    await page.waitForFunction(()=>document.querySelector('#editor-message').textContent.includes('连接失败'));
    assert.equal(await input('title').inputValue(),'未保存的正文'); assert.equal(await page.locator('#save-state').innerText(),'有未保存的修改');
    failSave=false; delaySave=true; await page.locator('[data-save]').click();
    assert(await input('body_md').isDisabled());
    await page.waitForFunction(()=>document.querySelector('#editor-message').textContent === '已保存'); delaySave=false;
    // A stale tab must not overwrite a newer version.
    posts.get(firstId).version++;
    await input('body_md').fill('A different local draft, which must remain intact.'); await page.locator('[data-save]').click();
    await page.waitForFunction(()=>document.querySelector('#editor-message').textContent.includes('其他窗口更新'));
    assert((await input('body_md').inputValue()).includes('remain intact'));
    page.once('dialog', dialog=>dialog.accept()); await page.locator(`#admin-posts button[data-id="${firstId}"]`).click();
    await page.waitForFunction(()=>document.querySelector('#post-form [name=body_md]').value.includes('A useful paragraph'));
    await input('title').fill('写作测试（仅本地）');
    await input('excerpt').fill('格式与发布流程的本地测试，不会提交到真实数据库');
    await input('body_md').fill('## 正文格式\n\n这是一篇用于验证写作功能的本地测试文章，没有发布到真实网站。\n\n- 保存草稿\n- 添加图片\n- 预览后发布');
    page.once('dialog', dialog=>dialog.accept('这张图片用于本地测试'));
    await page.locator('#post-image').setInputFiles(path.join(root,'assets/images/portrait-lifestyle.jpg'));
    await page.waitForFunction(()=>document.querySelector('#post-form [name=body_md]').value.includes('media:'));
    assert.equal(media.size,1);
    await page.locator('[data-save]').click(); await page.waitForFunction(()=>document.querySelector('#editor-message').textContent === '已保存');
    page.once('dialog', dialog=>dialog.accept()); await page.locator('[data-publish]').click();
    await page.waitForFunction(()=>document.querySelector('[data-post-state]').textContent === '已发布');
    const publicTitle = posts.get(firstId).title;
    await input('title').fill('Pending private title');
    await page.clock.fastForward(31000);
    await page.waitForFunction(()=>document.querySelector('#editor-message').textContent.includes('尚未发布'));
    assert.equal(posts.get(firstId).title,publicTitle, 'Autosave changed a public post');
    assert.equal(drafts.get(firstId).content.title,'Pending private title');
    assert.equal(posts.get(firstId).status,'published'); assert(await page.locator('[data-unpublish]').isVisible());
    for (const width of [320,375,768,1304]) {
      await page.setViewportSize({width,height:900}); assert(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth));
      await page.evaluate(()=>{ document.activeElement.blur(); window.scrollTo({top:0,behavior:'instant'}); });
      if ([375,1304].includes(width)) await page.screenshot({path:path.join(root,`.local/previews/writing-desk-${width}.png`),fullPage:true});
    }
    const visitor = await browser.newContext({reducedMotion:'reduce'}); await visitor.route(api+'/**',fixture);
    const reader = await visitor.newPage(); await reader.addInitScript(()=>sessionStorage.setItem('site-access','visitor'));
    await reader.goto(base+'/blog/'); await reader.locator(`[data-post-id="${firstId}"]`).waitFor();
    const category = posts.get(firstId).category;
    await reader.goto(base + '/blog/?category=' + category);
    await reader.locator(`[data-post-id="${firstId}"]`).waitFor();
    assert.equal(await reader.locator('#online-posts-title, #existing-notes-title').count(),0);
    assert.equal(await reader.locator('[data-blog-title]').innerText(),'心理学');
    assert.equal(new URL(await reader.locator('.language-link').getAttribute('href'), base).searchParams.get('category'), category);
    await reader.goto(base + '/blog/?category=photography');
    await reader.locator('[data-blog-empty]').waitFor({state:'visible'});
    assert.equal(await reader.locator('[data-blog-feed] article').count(), 0);
    // One archive flow covers topics, complete-body search beyond the first page, ordering, language and URL persistence.
    const archiveIds = Array.from({length:13}, (_, i) => {
      const id = crypto.randomUUID(), date = `2026-01-${String(i+1).padStart(2,'0')}T00:00:00Z`;
      posts.set(id, {id, title:`Archive ${String(i+1).padStart(2,'0')}`, excerpt:'Public archive fixture', body_md:i === 12 ? 'Body-only deepneedle' : 'Other body', category:'research', tags:['game-psychology'], language:'en', status:'published', published_at:date, updated_at:date});
      return id;
    });
    await reader.goto(base+'/blog/?category=research&topic=game-psychology&language=en&sort=oldest');
    await reader.waitForFunction(() => document.querySelector('[data-blog-count]').textContent.includes('13'));
    assert.equal(await reader.locator('[data-blog-feed] article').count(),12);
    assert.equal(await reader.locator('[data-blog-feed] h3').first().innerText(),'Archive 01');
    await reader.locator('[data-more-posts]').click();
    assert.equal(await reader.locator('[data-blog-feed] article').count(),13);
    const filter = name => reader.locator(`[data-blog-controls] [name="${name}"]`);
    await filter('q').fill('deepneedle');
    assert.equal(await reader.locator('[data-blog-feed] h3').innerText(),'Archive 13');
    const englishLink = new URL(await reader.locator('.language-link').getAttribute('href'),base);
    assert.equal(englishLink.searchParams.get('topic'),'game-psychology');
    assert.equal(englishLink.searchParams.get('q'),'deepneedle');
    await reader.locator('.language-link').click();
    await reader.locator(`[data-post-id="${archiveIds[12]}"]`).waitFor();
    assert.equal(await reader.locator('[data-blog-title]').innerText(),'Psychology');
    await filter('q').fill(''); await filter('sort').selectOption('title-desc');
    assert.equal(await reader.locator('[data-blog-feed] h3').first().innerText(),'Archive 13');
    await filter('sort').selectOption('newest');
    assert.equal(await reader.locator('[data-blog-feed] h3').first().innerText(),'Archive 13');
    await filter('language').selectOption('zh');
    assert(await reader.locator('[data-blog-empty]').isVisible());
    await reader.locator('[data-blog-controls] [type=reset]').click();
    assert.equal(new URL(reader.url()).search,'');
    await reader.locator('[data-blog-topics]').waitFor({state:'hidden'});
    for (const width of [320,375,768,1304]) {
      await reader.setViewportSize({width,height:880});
      assert(await reader.evaluate(()=>document.documentElement.scrollWidth <= innerWidth));
    }
    archiveIds.forEach(id => posts.delete(id));
    await reader.route(api+'/**', route => route.abort());
    await reader.goto(base+'/blog/?category=research&topic=experiment-design');
    await reader.waitForFunction(() => document.querySelector('[data-blog-message]').textContent.includes('暂时无法加载'));
    await filter('q').fill('音频采集');
    assert.equal(await reader.locator('[data-blog-feed] article').count(),1, 'Offline search lost the original note body');
    await reader.unroute(api+'/**');
    await reader.goto(base+'/blog/?category=research&topic=experiment-design');
    await reader.locator('[data-topic="experiment-design"][aria-current="true"]').waitFor();
    await reader.waitForFunction(() => document.querySelector('[data-blog-message]').textContent === '');
    for (const width of [375,1304]) {
      await reader.setViewportSize({width,height:880});
      await reader.screenshot({path:path.join(root,`.local/previews/blog-archive-${width}.png`),fullPage:true});
    }
    await reader.goto(base+'/blog/'); await reader.locator(`[data-post-id="${firstId}"]`).waitFor();
    await reader.locator(`[data-post-id="${firstId}"] h3 a`).click(); await reader.locator('#online-post article').waitFor({state:'visible'});
    assert.equal(await reader.locator('[data-post-title]').innerText(), posts.get(firstId).title);
    assert.equal(await reader.evaluate(()=>Boolean(window.pwned)),false);
    await reader.locator('.blog-body .figure-link img').waitFor();
    await reader.locator('.blog-body .figure-link').click(); await reader.locator('#image-viewer[open]').waitFor();
    assert.equal(visitor.pages().length,1);
    await reader.keyboard.press('Escape');
    await reader.locator('.language-link').click();
    assert.equal(new URL(reader.url()).searchParams.get('id'),firstId);
    await reader.locator('#online-post article').waitFor({state:'visible'});
    assert.equal(await reader.locator('#online-post article').getAttribute('lang'),'zh-Hans');
    for (const route of ['/account/','/en/account/','/admin/','/en/admin/','/blog/','/en/blog/','/en/blog/post/?id='+firstId]) {
      await reader.goto(base+route); assert(await reader.evaluate(()=>document.documentElement.scrollWidth <= innerWidth));
    }
    await page.setViewportSize({width:1304,height:880});
    await page.goto(base+'/admin/'); await page.locator('#writing-desk').waitFor({state:'visible'}); await page.locator(`#admin-posts button[data-id="${firstId}"]`).click();
    await page.waitForFunction(()=>document.querySelector('#post-form [name=title]').value === 'Pending private title');
    await page.locator('[data-unpublish]').waitFor({state:'visible'}); await page.locator('[data-unpublish]').click();
    await page.waitForFunction(()=>document.querySelector('[data-post-state]').textContent === '草稿');
    await page.goto(base+'/blog/post/?id='+firstId); await page.waitForFunction(()=>document.querySelector('[data-blog-message]').textContent.includes('尚未发布'));
    await page.goto(base+'/admin/'); await page.locator('#writing-desk').waitFor({state:'visible'}); await page.locator(`#admin-posts button[data-id="${firstId}"]`).click();
    await page.locator('[data-delete]').waitFor({state:'visible'});
    page.once('dialog',dialog=>dialog.dismiss()); await page.locator('[data-delete]').click(); assert.equal(posts.size,1);
    page.once('dialog',dialog=>dialog.accept()); await page.locator('[data-delete]').click();
    await page.waitForFunction(()=>document.querySelector('#editor-message').textContent === '文章已删除'); assert.equal(posts.size,0);
    await page.locator('#admin-posts button[data-id="/notes/gamelibrary-architecture/"]').click();
    assert.equal(await input('category').inputValue(),'development');
    assert((await input('body_md').inputValue()).includes('Tauri'), 'Opening an original note did not populate its body');
    await input('title').fill('GameLibrary 架构（编辑）');
    await input('body_md').fill('## Edited original note\n\nUpdated through the writing desk.');
    await page.clock.fastForward(31000);
    await page.waitForFunction(()=>document.querySelector('#editor-message').textContent.includes('尚未发布'));
    const imported = [...posts.values()][0];
    assert.equal(imported.source_path,'/notes/gamelibrary-architecture/');
    assert.equal(imported.title,'GameLibrary 架构');
    assert(await page.locator('[data-delete]').isHidden());
    page.once('dialog',dialog=>dialog.accept()); await page.locator('[data-publish]').click();
    await page.waitForFunction(()=>document.querySelector('#editor-message').textContent === '已保存');
    await reader.goto(base+'/notes/gamelibrary-architecture/');
    await reader.waitForFunction(()=>document.querySelector('[data-post-title]').textContent.includes('（编辑）'));
    assert((await reader.locator('[data-post-body]').innerText()).includes('Updated through the writing desk.'));
    await reader.goto(base+'/blog/?category=development');
    await reader.locator(`[data-post-id="${imported.id}"]`).waitFor();
    assert.equal(await reader.locator('.note-preview:visible').count(),1, 'Imported source appears twice');
    await page.goto(base+'/en/admin/'); await page.locator('#writing-desk').waitFor({state:'visible'});
    assert.equal(await page.locator('#admin-posts button').count(),2, 'The English desk does not show all original content');
    await visitor.close();
    await page.goto(base+'/account/'); await page.locator('#account-session').waitFor({state:'visible'}); await page.locator('[data-logout]').click();
    await page.locator('[data-auth-mode=forgot]').click(); await page.locator('[name=email]').fill('new-member@example.test'); await page.locator('#auth-submit').click();
    await page.waitForFunction(()=>document.querySelector('#auth-message').textContent.includes('重置邮件'));
    await page.locator('[name=code]').fill('123456'); await page.locator('#auth-submit').click();
    await page.waitForFunction(()=>document.querySelector('#auth-submit').textContent === '更新密码');
    await page.locator('[name=password]').fill('a-changed-test-password');
    await page.locator('[name=password_confirm]').fill('a-changed-test-password'); await page.locator('#auth-submit').click();
    await page.waitForFunction(()=>document.querySelector('#auth-message').textContent === '密码已更新');
    assert.equal(users.get('new-member@example.test').password,'a-changed-test-password');
    const fresh = await browser.newContext(); await fresh.route(api+'/**',fixture); const freshPage=await fresh.newPage();
    await login(freshPage,'new-member@example.test','a-changed-test-password'); await freshPage.locator('#account-session').waitFor({state:'visible'}); await fresh.close();
    const offline = await browser.newContext(); await offline.route(api+'/**',route=>route.abort()); const offPage=await offline.newPage();
    await offPage.goto(base+'/'); await offPage.locator('#access-choice[open]').waitFor(); await offPage.locator('[data-visitor]').click();
    assert.equal(await offPage.locator('#access-choice[open]').count(),0); await offline.close();
    const noScript=await browser.newContext({javaScriptEnabled:false}); const fallback=await noScript.newPage(); await fallback.goto(base+'/blog/');
    assert.equal(await fallback.locator('.note-preview').count(),2); assert(await fallback.locator('noscript').isVisible()); await noScript.close();
    // A decorative 3D background must never prevent authentication without WebGL.
    const withoutWebGL = await browser.newContext();
    await withoutWebGL.route(api+'/**',fixture);
    await withoutWebGL.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...options) {
        if (/^(webgl|experimental-webgl)/.test(type)) { window.loginSceneAttempted = true; return null; }
        return original.call(this, type, ...options);
      };
    });
    const scenePage = await withoutWebGL.newPage(), sceneErrors = [];
    scenePage.on('pageerror',error=>sceneErrors.push(error.message));
    await scenePage.goto(base+'/account/');
    await scenePage.waitForFunction(()=>window.loginSceneAttempted === true);
    await scenePage.locator('#auth-form').waitFor({state:'visible'});
    assert.equal(await scenePage.locator('#login-scene').getAttribute('aria-hidden'),'true');
    assert.equal(await scenePage.locator('#login-scene canvas').count(),0);
    await scenePage.locator('[name=email]').fill('member@example.test');
    await scenePage.locator('[name=password]').fill('a-valid-test-password');
    await scenePage.locator('#auth-submit').click({trial:true});
    assert.deepEqual(sceneErrors,[]);
    await withoutWebGL.close();
    assert.deepEqual(errors,[]);
    console.log('PASS: SDK signup/verification/login/reset/logout, durable fixture reloads, admin desk, save failure/conflicts, metadata-free upload, draft/published views, XSS, image viewer, visitor/offline/no-JS and bilingual responsive routes');
  } catch (error) {
    console.error('Page errors:', errors);
    await page.screenshot({path:path.join(root,'.local/previews/account-failure.png'),fullPage:true});
    throw error;
  } finally { await browser.close(); server.close(); }
})().catch(error=>{ console.error(error); server.close(); process.exitCode=1; });
