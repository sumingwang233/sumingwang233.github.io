import { createClient } from '@supabase/supabase-js';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

const configNode = document.querySelector('#site-account-config');
const config = configNode ? JSON.parse(configNode.textContent) : null;
if (config) start(config);

function start(config) {
  const t = config.text;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const accessKey = 'site-access';
  const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
  const idPattern = new RegExp(`^${uuid}$`, 'i');
  const mediaPattern = new RegExp(`^(${uuid})/(${uuid})\\.webp$`, 'i');
  const storageChoice = value => { try { sessionStorage.setItem(accessKey, value); } catch { /* Storage may be disabled. */ } };
  const getChoice = () => { try { return sessionStorage.getItem(accessKey); } catch { return null; } };
  const message = (target, text) => { if (target) target.textContent = text; };
  const errorText = error => {
    if (/invalid_credentials/.test(error?.code)) return t.credentials;
    if (/email_not_confirmed/.test(error?.code)) return t.unconfirmed;
    if (/rate_limit|over_.*limit/.test(error?.code) || error?.status === 429) return t.rate_limit;
    if (/email.*(send|address)|smtp/.test(error?.code) || /sending.*(email|mail)|smtp/i.test(error?.message)) return t.email_delivery;
    if (/otp_expired|otp_disabled/.test(error?.code)) return t.invalid_code;
    if (/weak_password/.test(error?.code)) return t.password_help;
    if (/PGRST205|PGRST202|42P01/.test(error?.code)) return t.setup;
    if (/42501/.test(error?.code) || error?.status === 403) return t.denied;
    return t.network;
  };
  const check = result => { if (result.error) throw result.error; return result.data; };
  let client;
  try {
    const url = new URL(config.url);
    if (config.enabled && url.protocol === 'https:' && url.hostname.endsWith('.supabase.co') && /^sb_publishable_[\w-]+$/.test(config.key)) {
      client = createClient(url.origin, config.key, {
        auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true },
        global: { fetch: (input, options = {}) => fetch(input, { ...options, signal: options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) }) }
      });
    }
  } catch { /* Unconfigured accounts never block visitor access. */ }
  const gate = $('#access-choice');
  const authForm = $('#auth-form');
  const authMessage = $('#auth-message');
  const accountSession = $('#account-session');
  const adminDesk = $('#writing-desk');
  let user = null, isAdmin = false, authMode = 'login', refreshing = 0;
  let post = null, dirty = false, saving = false, editorReady = false;
  const editor = $('#post-form');
  const field = name => editor.elements.namedItem(name);

  async function visit() {
    storageChoice('visitor'); gate?.close();
    try {
      if (client) check(await client.auth.signOut({ scope: 'local' }));
      return true;
    } catch (error) {
      // The SDK removes the local session even if logout cannot reach the server.
      message(authMessage, errorText(error)); return true;
    }
  }
  $('[data-visitor]')?.addEventListener('click', visit);
  $('[data-visitor-link]')?.addEventListener('click', async event => {
    event.preventDefault();
    if (await visit()) location.assign(config.home);
  });
  // Escape is equivalent to choosing a visitor, so a dialog never traps a reader.
  gate?.addEventListener('cancel', event => { event.preventDefault(); visit(); });
  const needsChoice = !authForm && !adminDesk && !getChoice();
  if (config.enabled && needsChoice && typeof gate?.showModal === 'function') gate.showModal();

  function setAuthMode(mode) {
    authMode = mode;
    if (!authForm) return;
    const password = authForm.elements.password, code = authForm.elements.code;
    const hasPassword = ['login', 'signup', 'recover'].includes(mode);
    const hasCode = mode === 'verify' || mode === 'recovery-code';
    $('[data-auth-password]', authForm).hidden = !hasPassword;
    $('[data-auth-code]', authForm).hidden = !hasCode;
    $('[data-auth-email]', authForm).hidden = mode === 'recover';
    password.required = hasPassword;
    // Older passwords remain valid at sign-in; only creation/reset enforce the stronger minimum.
    password.minLength = mode === 'login' ? 1 : 12;
    password.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
    code.required = hasCode;
    authForm.elements.email.required = mode !== 'recover';
    $('[data-resend]', authForm).hidden = mode !== 'verify';
    $('#auth-submit').textContent = ({ login: t.login, signup: t.signup, forgot: t.send_reset, verify: t.verify, 'recovery-code': t.verify, recover: t.reset })[mode];
    $$('[data-auth-mode]', authForm).forEach(button => button.setAttribute('aria-pressed', String(button.dataset.authMode === mode)));
    authForm.hidden = !client;
    if (accountSession) accountSession.hidden = true;
  }
  $$('[data-auth-mode]').forEach(button => button.addEventListener('click', () => { message(authMessage, ''); setAuthMode(button.dataset.authMode); }));
  const redirect = new URL(config.home + 'account/', location.origin).href;
  authForm?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!client) { message(authMessage, t.setup); return; }
    const email = authForm.elements.email.value.trim();
    const password = authForm.elements.password.value;
    const code = authForm.elements.code.value.trim();
    const mode = authMode;
    const buttons = $$('button', authForm);
    buttons.forEach(button => button.disabled = true);
    message(authMessage, t.loading);
    try {
      if (mode === 'signup') {
        check(await client.auth.signUp({ email, password, options: { emailRedirectTo: redirect } }));
        setAuthMode('verify'); message(authMessage, t.signup_sent);
      } else if (mode === 'login') {
        check(await client.auth.signInWithPassword({ email, password }));
        storageChoice('account'); await refreshAccount(); message(authMessage, t.signed_in);
      } else if (mode === 'forgot') {
        check(await client.auth.resetPasswordForEmail(email, { redirectTo: redirect }));
        setAuthMode('recovery-code'); message(authMessage, t.reset_sent);
      } else if (mode === 'verify' || mode === 'recovery-code') {
        check(await client.auth.verifyOtp({ email, token: code, type: mode === 'verify' ? 'email' : 'recovery' }));
        storageChoice('account');
        if (mode === 'recovery-code') setAuthMode('recover');
        else { await refreshAccount(); message(authMessage, t.verified); }
      } else if (mode === 'recover') {
        check(await client.auth.updateUser({ password }));
        authMode = 'login'; await refreshAccount(); message(authMessage, t.password_updated);
      }
    } catch (error) { message(authMessage, errorText(error)); }
    finally { authForm.elements.password.value = ''; authForm.elements.code.value = ''; buttons.forEach(button => button.disabled = false); }
  });
  $('[data-resend]')?.addEventListener('click', async event => {
    if (!authForm.elements.email.reportValidity()) return;
    const button = event.currentTarget; button.disabled = true;
    try { check(await client.auth.resend({ type: 'signup', email: authForm.elements.email.value.trim(), options: { emailRedirectTo: redirect } })); message(authMessage, t.signup_sent); }
    catch (error) { message(authMessage, errorText(error)); }
    finally { button.disabled = false; }
  });
  $('[data-logout]')?.addEventListener('click', async () => {
    try { check(await client.auth.signOut({ scope: 'local' })); storageChoice('visitor'); await refreshAccount(); message(authMessage, t.signed_out); }
    catch (error) { message(authMessage, errorText(error)); }
  });

  async function refreshAccount() {
    const serial = ++refreshing;
    let nextUser = null, nextAdmin = false;
    try {
      const session = check(await client.auth.getSession()).session;
      if (session) {
        nextUser = check(await client.auth.getUser()).user;
        nextAdmin = check(await client.rpc('is_site_admin')) === true;
      }
    } catch (error) { message(authMessage || $('#admin-message'), errorText(error)); }
    if (serial !== refreshing) return;
    user = nextUser; isAdmin = nextAdmin;
    $('[data-account-nav]')?.setAttribute('aria-label', user ? t.signed_in + ' · ' + t.account : t.account);
    if (user) { storageChoice('account'); gate?.close(); }
    if (authForm) {
      authForm.hidden = Boolean(user) && authMode !== 'recover';
      accountSession.hidden = !user || authMode === 'recover';
      message($('[data-account-email]'), user?.email || '');
      $('[data-admin-link]').hidden = !isAdmin;
    }
    if (adminDesk) {
      adminDesk.hidden = !isAdmin; $('#admin-locked').hidden = isAdmin;
      if (!isAdmin) message($('#admin-message'), user ? t.denied : t.owner_only);
      else if (!editorReady) { editorReady = true; newPost(); await loadAdminPosts(); }
    }
  }

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  const dateText = date => new Intl.DateTimeFormat(config.lang === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date));
  function postCard(item) {
    const article = element('article', undefined, 'entry note-preview');
    const meta = element('p', `${dateText(item.published_at)} · ${t[item.category]} · ${item.language === 'zh' ? '中文' : 'English'}`, 'entry-meta');
    const heading = element('h3'), link = element('a', item.title);
    link.href = config.home + 'blog/post/?id=' + encodeURIComponent(item.id);
    heading.append(link); article.append(meta, heading, element('p', item.excerpt, 'summary'));
    return article;
  }
  async function loadBlog() {
    const feed = $('[data-blog-feed]');
    if (!feed) return;
    const status = $('[data-blog-message]');
    if (!client) { message(status, t.setup); return; }
    let offset = 0;
    const featured = feed.hasAttribute('data-featured');
    const size = featured ? 2 : 12;
    const more = $('[data-more-posts]');
    async function load() {
      message(status, t.loading); if (more) more.disabled = true;
      try {
        // Both language archives identify the original language instead of inventing translations.
        const items = check(await client.from('blog_posts').select('id,title,excerpt,category,language,published_at').eq('status', 'published').order('published_at', { ascending: false }).order('id').range(offset, offset + size - 1));
        feed.append(...items.map(postCard)); offset += items.length;
        message(status, offset === 0 && !featured ? t.empty_blog : '');
        if (more) more.hidden = items.length < size;
      } catch (error) { message(status, errorText(error)); }
      finally { if (more) more.disabled = false; }
    }
    more?.addEventListener('click', load);
    await load();
  }

  async function renderMarkdown(markdown, target, postId) {
    const tokens = marked.lexer(markdown);
    const paths = new Set();
    marked.walkTokens(tokens, token => {
      if (token.type === 'image' && token.href.startsWith('media:')) {
        const path = token.href.slice(6), match = mediaPattern.exec(path);
        if (match && match[1] === postId) paths.add(path);
      }
    });
    const signed = new Map();
    if (paths.size) {
      const urls = check(await client.storage.from('blog-media').createSignedUrls([...paths], 3600));
      urls.forEach(item => { if (!item.error && item.signedUrl) signed.set(item.path, item.signedUrl); });
    }
    marked.walkTokens(tokens, token => {
      if (token.type === 'image' && token.href.startsWith('media:')) token.href = signed.get(token.href.slice(6)) || '';
    });
    const fragment = DOMPurify.sanitize(marked.parser(tokens), {
      RETURN_DOM_FRAGMENT: true,
      ALLOWED_TAGS: ['p','br','h2','h3','h4','h5','h6','strong','em','del','ul','ol','li','blockquote','pre','code','a','img','hr','table','thead','tbody','tr','th','td'],
      ALLOWED_ATTR: ['href','src','alt','title','start']
    });
    const signedValues = new Set(signed.values());
    $$('img', fragment).forEach(image => {
      let allowed = signedValues.has(image.getAttribute('src'));
      try { const url = new URL(image.getAttribute('src'), location.href); allowed ||= url.origin === location.origin && url.pathname.startsWith('/assets/images/'); } catch { /* invalid URL */ }
      if (!allowed) { image.replaceWith(element('span', image.alt)); return; }
      image.loading = 'lazy'; image.decoding = 'async'; image.referrerPolicy = 'no-referrer';
      const link = element('a', undefined, 'figure-link'); link.href = image.src;
      link.setAttribute('aria-label', t.image + ' · ' + image.alt);
      link.setAttribute('aria-haspopup', 'dialog'); link.setAttribute('aria-controls', 'image-viewer');
      image.replaceWith(link); link.append(image);
    });
    $$('a:not(.figure-link)', fragment).forEach(link => {
      try {
        const url = new URL(link.getAttribute('href'), location.href);
        if (!['https:', 'http:', 'mailto:'].includes(url.protocol)) { link.removeAttribute('href'); return; }
        link.rel = 'noopener noreferrer'; link.referrerPolicy = 'no-referrer';
      } catch { link.removeAttribute('href'); }
    });
    target.replaceChildren(fragment);
  }
  async function loadPost() {
    const page = $('#online-post'); if (!page) return;
    const status = $('[data-blog-message]', page), id = new URLSearchParams(location.search).get('id');
    if (!client) { message(status, t.setup); return; }
    if (!idPattern.test(id || '')) { message(status, t.not_found); return; }
    try {
      const item = check(await client.from('blog_posts').select('*').eq('id', id).eq('status', 'published').maybeSingle());
      if (!item) { message(status, t.not_found); return; }
      await renderMarkdown(item.body_md, $('[data-post-body]', page), item.id);
      message($('[data-post-title]', page), item.title); message($('[data-post-excerpt]', page), item.excerpt);
      message($('[data-post-meta]', page), `${dateText(item.published_at)} · ${t[item.category]} · ${item.language === 'zh' ? '中文' : 'English'}`);
      document.title = item.title + ' · Xin Wang';
      $('article', page).lang = item.language === 'zh' ? 'zh-Hans' : 'en';
      $$('.language-link').forEach(link => { const target = new URL(link.href); target.searchParams.set('id', item.id); link.href = target.href; });
      $('article', page).hidden = false; message(status, '');
    } catch (error) { message(status, errorText(error)); }
  }

  function setDirty(value) { dirty = value; message($('#save-state'), value ? t.dirty : post?.updated_at ? `${t.saved} · ${new Date(post.updated_at).toLocaleTimeString()}` : ''); }
  function confirmDiscard() { return !dirty || window.confirm(t.unsaved); }
  function newPost() {
    post = null; editor.reset(); field('language').value = config.lang;
    message($('[data-post-state]'), t.draft); message($('#editor-message'), '');
    $('[data-delete]').hidden = true; $('[data-unpublish]').hidden = true;
    $('[data-publish]').hidden = false; $('[data-save]').hidden = false;
    $('#post-preview').hidden = true; setDirty(false);
    $$('#admin-posts button').forEach(button => button.removeAttribute('aria-current'));
  }
  function fillPost(item) {
    post = item;
    for (const name of ['title','excerpt','body_md','category','language']) field(name).value = item[name];
    field('tags').value = item.tags.join(', ');
    message($('[data-post-state]'), t[item.status]); message($('#editor-message'), '');
    $('[data-delete]').hidden = false; $('[data-unpublish]').hidden = item.status !== 'published';
    $('[data-save]').hidden = item.status === 'published';
    $('#post-preview').hidden = true; setDirty(false);
    $$('#admin-posts button').forEach(button => button.setAttribute('aria-current', String(button.dataset.id === item.id)));
  }
  async function loadAdminPosts() {
    try {
      const items = check(await client.from('blog_posts').select('id,title,status,updated_at').order('updated_at', { ascending: false }).limit(100));
      // ponytail: first 100 recent posts in the desk; add pagination when the archive grows beyond this.
      const index = $('#admin-posts'); index.replaceChildren();
      if (!items.length) index.append(element('li', t.empty_desk, 'form-help'));
      items.forEach(item => {
        const li = element('li'), button = element('button', item.title || t.new_post);
        button.type = 'button'; button.dataset.id = item.id;
        button.setAttribute('aria-current', String(post?.id === item.id));
        button.append(element('span', `${t[item.status]} · ${dateText(item.updated_at)}`));
        button.addEventListener('click', async () => {
          if (saving || !confirmDiscard()) return;
          try { fillPost(check(await client.from('blog_posts').select('*').eq('id', item.id).single())); }
          catch (error) { message($('#editor-message'), errorText(error)); }
        });
        li.append(button); index.append(li);
      });
    } catch (error) { message($('#editor-message'), errorText(error)); }
  }
  function editorValue(status) {
    const tags = [...new Set(field('tags').value.split(/[,，]/).map(tag => tag.trim()).filter(Boolean))];
    if (tags.length > 5 || tags.some(tag => [...tag].length > 20)) throw new Error(t.invalid_tags);
    const value = { title: field('title').value.trim(), excerpt: field('excerpt').value.trim(), body_md: field('body_md').value, category: field('category').value, language: field('language').value, tags, status };
    if (status === 'published' && ([...value.title].length < 3 || [...value.body_md.trim()].length < 10)) throw new Error(t.invalid_post);
    return value;
  }
  async function savePost(status) {
    if (!isAdmin || saving) return false;
    let value;
    try { value = editorValue(status); } catch (error) { message($('#editor-message'), error.message); return false; }
    saving = true;
    const controls = $$('button,input,textarea,select', editor); controls.forEach(control => control.disabled = true);
    message($('#save-state'), t.saving);
    try {
      let query = client.from('blog_posts');
      query = post ? query.update(value).eq('id', post.id).eq('version', post.version) : query.insert(value);
      const items = check(await query.select('*'));
      if (!items.length) { message($('#editor-message'), t.conflict); return false; }
      post = items[0]; setDirty(false);
      message($('[data-post-state]'), t[post.status]); message($('#editor-message'), t.saved);
      $('[data-delete]').hidden = false; $('[data-unpublish]').hidden = post.status !== 'published';
      $('[data-save]').hidden = post.status === 'published';
      await loadAdminPosts(); return true;
    } catch (error) { message($('#editor-message'), errorText(error)); return false; }
    finally { saving = false; controls.forEach(control => control.disabled = false); if (dirty) message($('#save-state'), t.dirty); }
  }
  if (editor) {
    editor.addEventListener('input', () => setDirty(true));
    editor.addEventListener('submit', event => { event.preventDefault(); savePost('draft'); });
    $('[data-new-post]').addEventListener('click', () => { if (!saving && confirmDiscard()) { newPost(); $('[data-save]').hidden = false; field('title').focus(); } });
    $('[data-publish]').addEventListener('click', () => { if (window.confirm(t.confirm_publish)) savePost('published'); });
    $('[data-unpublish]').addEventListener('click', () => savePost('draft'));
    $('[data-delete]').addEventListener('click', async () => {
      if (!post || saving || !window.confirm(t.confirm_delete)) return;
      saving = true;
      const controls = $$('button,input,textarea,select', editor); controls.forEach(control => control.disabled = true);
      try {
        const deleted = check(await client.from('blog_posts').delete().eq('id', post.id).eq('version', post.version).select('id'));
        if (!deleted.length) { message($('#editor-message'), t.conflict); return; }
        newPost(); $('[data-save]').hidden = false; await loadAdminPosts(); message($('#editor-message'), t.deleted);
      } catch (error) { message($('#editor-message'), errorText(error)); }
      finally { saving = false; controls.forEach(control => control.disabled = false); }
    });
    window.addEventListener('beforeunload', event => { if (dirty || saving) { event.preventDefault(); event.returnValue = ''; } });
    $('[data-preview]').addEventListener('click', async () => {
      const preview = $('#post-preview');
      if (!preview.hidden) { preview.hidden = true; return; }
      try { await renderMarkdown(field('body_md').value, preview, post?.id); preview.prepend(element('h2', field('title').value)); preview.hidden = false; message($('#editor-message'), ''); }
      catch (error) { message($('#editor-message'), errorText(error)); }
    });
    function insert(before, after = '') {
      const body = field('body_md'), selection = body.value.slice(body.selectionStart, body.selectionEnd);
      body.setRangeText(before + selection + after, body.selectionStart, body.selectionEnd, 'end'); body.focus(); setDirty(true);
    }
    $$('[data-format]').forEach(button => button.addEventListener('click', () => {
      const format = button.dataset.format;
      if (format === 'link') {
        const url = window.prompt(t.link_prompt, 'https://');
        try { if (url && new URL(url).protocol === 'https:') insert('[', `](${encodeURI(url).replace(/[()]/g, char => char === '(' ? '%28' : '%29')})`); } catch { /* Cancel/invalid URL leaves the text untouched. */ }
      } else {
        const pairs = { heading: ['\n\n## ', '\n'], bold: ['**','**'], list: ['\n- ',''], quote: ['\n> ',''], code_block: ['\n\n```\n','\n```\n'] };
        insert(...pairs[format]);
      }
    }));
    $('[data-insert-image]').addEventListener('click', () => $('#post-image').click());
    $('#post-image').addEventListener('change', async event => {
      const file = event.target.files[0]; event.target.value = ''; if (!file) return;
      if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 10 * 1024 * 1024) { message($('#editor-message'), t.image_invalid); return; }
      const alt = window.prompt(t.image_alt); if (alt === null) return;
      if (saving) return;
      // Create the associated row first, so storage policies can authorize this upload.
      if (!post && !await savePost('draft')) return;
      const postId = post.id;
      saving = true;
      const controls = $$('button,input,textarea,select', editor); controls.forEach(control => control.disabled = true);
      message($('#editor-message'), t.image_uploading);
      let bitmap;
      try {
        bitmap = await createImageBitmap(file);
        if (bitmap.width * bitmap.height > 50000000) throw new Error('Image dimensions');
        const ratio = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * ratio)); canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
        canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.86));
        if (!blob || blob.type !== 'image/webp' || blob.size > 5 * 1024 * 1024) throw new Error('Image export');
        const path = `${postId}/${crypto.randomUUID()}.webp`;
        check(await client.storage.from('blog-media').upload(path, blob, { contentType: 'image/webp', upsert: false }));
        insert(`\n\n![${alt.replace(/[\[\]\\\n]/g, '').slice(0, 200)}](media:${path})\n\n`);
        message($('#editor-message'), t.dirty);
      } catch { message($('#editor-message'), t.image_failed); }
      finally { bitmap?.close(); saving = false; controls.forEach(control => control.disabled = false); }
    });
    $('[data-export]').addEventListener('click', async event => {
      const button = event.currentTarget; button.disabled = true;
      try {
        const posts = [];
        for (let offset = 0; ; offset += 500) {
          const batch = check(await client.from('blog_posts').select('*').order('id').range(offset, offset + 499));
          posts.push(...batch); if (batch.length < 500) break;
        }
        const url = URL.createObjectURL(new Blob([JSON.stringify({ exported_at: new Date().toISOString(), posts }, null, 2)], { type: 'application/json' }));
        const link = element('a'); link.href = url; link.download = 'blog-writing-backup.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (error) { message($('#editor-message'), errorText(error)); }
      finally { button.disabled = false; }
    });
  }
  async function initialize() {
    if (!client) { message(authMessage || $('#admin-message'), t.setup); return; }
    if (authForm) setAuthMode('login');
    client.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setAuthMode('recover');
      // SDK callbacks hold the auth lock; perform follow-up requests after they return.
      if (['SIGNED_IN','SIGNED_OUT','TOKEN_REFRESHED','USER_UPDATED','PASSWORD_RECOVERY'].includes(event)) setTimeout(refreshAccount, 0);
    });
    const params = new URLSearchParams(location.search), tokenHash = params.get('token_hash'), type = params.get('type');
    if (authForm && tokenHash && ['email','recovery'].includes(type)) {
      try { check(await client.auth.verifyOtp({ token_hash: tokenHash, type })); if (type === 'recovery') setAuthMode('recover'); message(authMessage, t.verified); }
      catch (error) { message(authMessage, errorText(error)); }
      finally { history.replaceState(null, '', location.pathname); }
    }
    if (authForm && params.has('error')) { message(authMessage, t.invalid_code); history.replaceState(null, '', location.pathname); }
    await refreshAccount();
    if (authForm && (params.has('code') || location.hash.includes('access_token'))) history.replaceState(null, '', location.pathname);
  }
  initialize().catch(error => message(authMessage || $('#admin-message'), errorText(error)));
  loadBlog(); loadPost();
}
