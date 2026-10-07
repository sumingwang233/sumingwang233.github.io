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
    if (/PGRST205|PGRST204|PGRST202|42P01|42703/.test(error?.code)) return t.setup;
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
  let post = null, dirty = false, saving = false, opening = false, editorReady = false;
  let editRevision = 0, previewRevision = 0, previewTimer, autosaveBlocked = false;
  const editor = $('#post-form');
  const field = name => editor.elements.namedItem(name);
  const staticPosts = config.static_posts || [];
  const fontFamilies = { default: 'var(--font-body)', serif: 'var(--font-display)', sans: 'var(--font-body)', mono: 'monospace' };
  const signedImages = new Map();

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
    const password = authForm.elements.password, code = authForm.elements.code, confirmation = authForm.elements.password_confirm;
    const creating = mode === 'signup' || mode === 'recover';
    const hasPassword = ['login', 'signup', 'recover'].includes(mode);
    const hasCode = mode === 'verify' || mode === 'recovery-code';
    $('[data-auth-password]', authForm).hidden = !hasPassword;
    $('[data-auth-code]', authForm).hidden = !hasCode;
    $('[data-auth-email]', authForm).hidden = mode === 'recover';
    password.required = hasPassword;
    // Older passwords remain valid at sign-in; only creation/reset enforce the stronger minimum.
    password.minLength = mode === 'login' ? 1 : 12;
    password.autocomplete = mode === 'login' ? 'current-password' : 'new-password';
    message($('[data-password-label]', authForm), creating ? t.password_new : t.password);
    $('[data-auth-confirm]', authForm).hidden = !creating;
    $('[data-password-strength]', authForm).hidden = !creating;
    confirmation.required = creating;
    confirmation.disabled = !creating;
    password.value = confirmation.value = '';
    updatePasswordFeedback();
    code.required = hasCode;
    authForm.elements.email.required = mode !== 'recover';
    $('[data-resend]', authForm).hidden = mode !== 'verify';
    $('#auth-submit').textContent = ({ login: t.login, signup: t.signup, forgot: t.send_reset, verify: t.verify, 'recovery-code': t.verify, recover: t.reset })[mode];
    $$('[data-auth-mode]', authForm).forEach(button => button.setAttribute('aria-pressed', String(button.dataset.authMode === mode)));
    authForm.hidden = !client;
    if (accountSession) accountSession.hidden = true;
  }
  function updatePasswordFeedback() {
    if (!authForm) return;
    const password = authForm.elements.password.value, confirmation = authForm.elements.password_confirm;
    confirmation.setCustomValidity(confirmation.value && confirmation.value !== password ? t.password_mismatch : '');
    let strength = 0;
    if (password) {
      // This local estimate is guidance; server policy remains the authority.
      const unique = new Set(password).size;
      const common = /password|qwerty|letmein|123456|abcdef/i.test(password) || unique < 4;
      const types = [/\p{Ll}/u, /\p{Lu}/u, /\p{N}/u, /[^\p{L}\p{N}\s]/u].filter(pattern => pattern.test(password)).length;
      strength = password.length < 12 || common ? 1 : ((password.length >= 16 && unique >= 6) || (types >= 3 && unique >= 6)) ? 3 : 2;
    }
    const label = `${t.password_strength}${config.lang === 'zh' ? '：' : ': '}${[t.strength_empty, t.strength_weak, t.strength_medium, t.strength_strong][strength]}`;
    const meter = $('[data-password-strength] meter', authForm), output = $('[data-strength-text]', authForm);
    meter.value = strength;
    meter.setAttribute('aria-valuetext', label);
    if (output.textContent !== label) message(output, label);
  }
  authForm?.elements.password.addEventListener('input', updatePasswordFeedback);
  authForm?.elements.password_confirm.addEventListener('input', updatePasswordFeedback);
  $$('[data-auth-mode]').forEach(button => button.addEventListener('click', () => { message(authMessage, ''); setAuthMode(button.dataset.authMode); }));
  const redirect = new URL(config.home + 'account/', location.origin).href;
  authForm?.addEventListener('submit', async event => {
    event.preventDefault();
    if (!client) { message(authMessage, t.setup); return; }
    const email = authForm.elements.email.value.trim();
    const password = authForm.elements.password.value;
    const code = authForm.elements.code.value.trim();
    const mode = authMode;
    if (mode === 'signup' || mode === 'recover') {
      if (password.length < 12 || password.length > 128) { message(authMessage, t.password_help); return; }
      if (password !== authForm.elements.password_confirm.value) {
        authForm.elements.password_confirm.setCustomValidity(t.password_mismatch);
        message(authMessage, t.password_mismatch);
        authForm.elements.password_confirm.reportValidity();
        return;
      }
    }
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
    } catch (error) {
      if (error?.code === 'email_not_confirmed') setAuthMode('verify');
      message(authMessage, errorText(error));
    }
    finally { authForm.elements.password.value = ''; authForm.elements.password_confirm.value = ''; authForm.elements.code.value = ''; updatePasswordFeedback(); buttons.forEach(button => button.disabled = false); }
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
    link.href = item.source_path || config.home + 'blog/post/?id=' + encodeURIComponent(item.id);
    heading.append(link); article.append(meta, heading, element('p', item.excerpt, 'summary'));
    return article;
  }
  async function loadBlog() {
    const feed = $('[data-blog-feed]');
    const originalCards = $$('[data-static-source]');
    if (!feed && !originalCards.length) return;
    const requested = new URLSearchParams(location.search).get('category');
    const category = feed && !feed.hasAttribute('data-featured') && ['essay', 'research', 'development', 'photography'].includes(requested) ? requested : null;
    if (category) {
      message($('[data-blog-title]'), t[category]);
      document.title = `${t[category]} · ${document.title.split(' · ').at(-1)}`;
      // Keep the selected column when switching languages.
      $$('.language-link').forEach(link => { const url = new URL(link.href); url.searchParams.set('category', category); link.href = url.href; });
    }
    const overridden = new Set();
    function updateOriginals() {
      originalCards.forEach(card => { card.hidden = Boolean(feed && overridden.has(card.dataset.staticSource)) || Boolean(category && card.dataset.category !== category); });
      const notes = $('[data-existing-notes]');
      if (notes) notes.hidden = !originalCards.some(card => !card.hidden);
    }
    updateOriginals();
    const status = $('[data-blog-message]');
    if (!client) { if (feed) message(status, t.setup); return; }
    try {
      const paths = [...new Set(originalCards.map(card => card.dataset.staticSource))];
      for (let offset = 0; offset < paths.length; offset += 100) {
        const items = check(await client.from('blog_posts').select('id,title,excerpt,category,language,published_at,source_path').eq('status', 'published').in('source_path', paths.slice(offset, offset + 100)));
        items.forEach(item => {
          overridden.add(item.source_path);
          originalCards.filter(card => card.dataset.staticSource === item.source_path).forEach(card => { card.dataset.category = item.category; if (!feed) card.replaceChildren(...postCard(item).childNodes); });
        });
      }
      updateOriginals();
    } catch { /* Source notes remain readable when the online service is unavailable. */ }
    if (!feed) return;
    let offset = 0;
    const featured = feed.hasAttribute('data-featured');
    const size = featured ? 2 : 12;
    const more = $('[data-more-posts]');
    async function load() {
      message(status, t.loading); if (more) more.disabled = true;
      try {
        // Both language archives identify the original language instead of inventing translations.
        let query = client.from('blog_posts').select('id,title,excerpt,category,language,published_at,source_path').eq('status', 'published');
        if (category) query = query.eq('category', category);
        const items = check(await query.order('published_at', { ascending: false }).order('id').range(offset, offset + size - 1));
        feed.append(...items.map(postCard)); offset += items.length;
        items.forEach(item => { if (item.source_path) overridden.add(item.source_path); }); updateOriginals();
        message(status, offset === 0 && !featured ? t.empty_blog : '');
        if (more) more.hidden = items.length < size;
      } catch (error) { message(status, errorText(error)); }
      finally { if (more) more.disabled = false; }
    }
    more?.addEventListener('click', load);
    await load();
  }

  async function renderMarkdown(markdown, target, postId, isCurrent = () => true) {
    const tokens = marked.lexer(markdown);
    const paths = new Set();
    marked.walkTokens(tokens, token => {
      if (token.type === 'image' && token.href.startsWith('media:')) {
        const path = token.href.slice(6), match = mediaPattern.exec(path);
        if (match && match[1] === postId) paths.add(path);
      }
    });
    const signed = new Map();
    const missing = [...paths].filter(path => !signedImages.has(path) || signedImages.get(path).expires < Date.now());
    if (missing.length) {
      const urls = check(await client.storage.from('blog-media').createSignedUrls(missing, 3600));
      urls.forEach(item => { if (!item.error && item.signedUrl) signedImages.set(item.path, { url: item.signedUrl, expires: Date.now() + 3300000 }); });
    }
    paths.forEach(path => { if (signedImages.has(path)) signed.set(path, signedImages.get(path).url); });
    marked.walkTokens(tokens, token => {
      if (token.type === 'image' && token.href.startsWith('media:')) token.href = signed.get(token.href.slice(6)) || '';
    });
    const fragment = DOMPurify.sanitize(marked.parser(tokens), {
      RETURN_DOM_FRAGMENT: true,
      ALLOWED_TAGS: ['p','br','h1','h2','h3','h4','h5','h6','strong','em','del','ul','ol','li','blockquote','pre','code','a','img','hr','table','thead','tbody','tr','th','td'],
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
    if (isCurrent()) target.replaceChildren(fragment);
  }
  function applyBodyStyle(target, style = {}) {
    target.style.fontFamily = Object.hasOwn(fontFamilies, style.font_family) ? fontFamilies[style.font_family] : fontFamilies.default;
    target.dataset.bodyFont = style.font_family || 'default';
    for (const [key, css, min, max, unit] of [['font_size','font-size',14,28,'px'], ['line_height','line-height',1.2,2.4,''], ['letter_spacing','letter-spacing',-0.5,3,'px']]) {
      const value = style[key];
      if (typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max) target.style.setProperty(css, value + unit);
      else target.style.removeProperty(css);
    }
  }
  async function loadPost() {
    const page = $('#online-post') || $('[data-static-post]'); if (!page) return;
    const source = page.dataset.staticPost;
    const status = $('[data-blog-message]', page), id = new URLSearchParams(location.search).get('id');
    if (!client) { if (!source) message(status, t.setup); return; }
    if (!source && !idPattern.test(id || '')) { message(status, t.not_found); return; }
    try {
      const item = check(await client.from('blog_posts').select('*').eq(source ? 'source_path' : 'id', source || id).eq('status', 'published').maybeSingle());
      if (!item) { if (!source) message(status, t.not_found); return; }
      const body = $('[data-post-body]', page); body.classList.add('blog-body');
      const figures = source ? $$('.project-figure,.architecture-figure,.figure-pending', body).map(figure => figure.cloneNode(true)) : [];
      await renderMarkdown(item.body_md, body, item.id); body.append(...figures); applyBodyStyle(body, item.body_style);
      message($('[data-post-title]', page), item.title); message($('[data-post-excerpt]', page), item.excerpt);
      message($('[data-post-meta]', page), `${dateText(item.published_at)} · ${t[item.category]} · ${item.language === 'zh' ? '中文' : 'English'}`);
      document.title = item.title + ' · Xin Wang';
      const article = source ? page : $('article', page); article.lang = item.language === 'zh' ? 'zh-Hans' : 'en';
      if (!source) $$('.language-link').forEach(link => { const target = new URL(link.href); target.searchParams.set('id', item.id); link.href = target.href; });
      article.hidden = false; message(status, '');
    } catch (error) { if (!source) message(status, errorText(error)); }
  }

  function setDirty(value) { dirty = value; message($('#save-state'), value ? t.dirty : post?.updated_at ? `${t.saved} · ${new Date(post.updated_at).toLocaleTimeString()}` : ''); }
  function confirmDiscard() { return !dirty || window.confirm(t.unsaved); }
  function bodyStyle() {
    const style = { font_family: field('font_family').value };
    if (!Object.hasOwn(fontFamilies, style.font_family)) throw new Error(t.invalid_style);
    for (const [name, min, max] of [['font_size',14,28], ['line_height',1.2,2.4], ['letter_spacing',-0.5,3]]) {
      const value = Number(field(name).value);
      if (!field(name).value || !Number.isFinite(value) || value < min || value > max) throw new Error(t.invalid_style);
      style[name] = value;
    }
    return style;
  }
  function updatePreview() {
    clearTimeout(previewTimer);
    const serial = ++previewRevision;
    message($('[data-preview-title]'), field('title').value);
    try { applyBodyStyle($('[data-preview-body]'), bodyStyle()); } catch { /* Keep the last valid typography while a number is being typed. */ }
    previewTimer = setTimeout(async () => {
      if ($('#post-preview').hidden) return;
      try { await renderMarkdown(field('body_md').value, $('[data-preview-body]'), post?.id, () => serial === previewRevision && !$('#post-preview').hidden); }
      catch (error) { if (serial === previewRevision) message($('#editor-message'), errorText(error)); }
    }, 200);
  }
  function changed() { editRevision++; setDirty(true); updatePreview(); }
  function editorState() {
    message($('[data-post-state]'), t[post?.status || 'draft']);
    // Static source files remain an offline fallback; removing them requires editing the source.
    $('[data-delete]').hidden = !post?.id || Boolean(post.source_path);
    $('[data-unpublish]').hidden = post?.status !== 'published' || Boolean(post.source_path);
    $('[data-save]').hidden = false;
  }
  function newPost() {
    post = null; editor.reset(); field('language').value = config.lang;
    autosaveBlocked = false; editRevision++; editorState(); message($('#editor-message'), ''); setDirty(false); updatePreview();
    $$('#admin-posts button').forEach(button => button.removeAttribute('aria-current'));
  }
  function fillPost(item, draft) {
    post = item;
    editor.reset();
    const content = draft && draft.post_version === item.version ? draft.content : item;
    for (const name of ['title','excerpt','body_md','category','language']) field(name).value = content[name];
    field('tags').value = (content.tags || []).join(', ');
    for (const [name, value] of Object.entries(content.body_style || {})) if (field(name)) field(name).value = value;
    autosaveBlocked = false; editRevision++; editorState(); setDirty(false); updatePreview();
    message($('#editor-message'), content === item ? '' : t.pending_draft);
    $$('#admin-posts button').forEach(button => button.setAttribute('aria-current', String(button.dataset.id === (item.id || item.source_path))));
  }
  async function allPosts(columns = '*') {
    const posts = [];
    for (let offset = 0; ; offset += 500) {
      const batch = check(await client.from('blog_posts').select(columns).order('id').range(offset, offset + 499));
      posts.push(...batch); if (batch.length < 500) break;
    }
    return posts;
  }
  async function loadAdminPosts() {
    try {
      const items = await allPosts('id,title,status,updated_at,source_path');
      const sources = new Set(items.map(item => item.source_path));
      items.push(...staticPosts.filter(item => !sources.has(item.source_path)));
      items.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      const index = $('#admin-posts'); index.replaceChildren();
      if (!items.length) index.append(element('li', t.empty_desk, 'form-help'));
      items.forEach(item => {
        const li = element('li'), button = element('button', item.title || t.new_post);
        button.type = 'button'; button.dataset.id = item.id || item.source_path;
        button.setAttribute('aria-current', String(Boolean(post && (post.id || post.source_path) === button.dataset.id)));
        button.append(element('span', `${item.source_path ? t.static_post + ' · ' : ''}${t[item.status]} · ${dateText(item.updated_at)}`));
        button.addEventListener('click', async () => {
          if (saving || opening || !confirmDiscard()) return;
          opening = true;
          const controls = $$('button,input,textarea,select', editor); controls.forEach(control => control.disabled = true);
          try {
            if (!item.id) fillPost(item);
            else {
              const full = check(await client.from('blog_posts').select('*').eq('id', item.id).single());
              const draft = check(await client.from('blog_post_drafts').select('*').eq('post_id', item.id).maybeSingle());
              fillPost(full, draft);
            }
          }
          catch (error) { message($('#editor-message'), errorText(error)); }
          finally { opening = false; controls.forEach(control => control.disabled = false); }
        });
        li.append(button); index.append(li);
      });
    } catch (error) { message($('#editor-message'), errorText(error)); }
  }
  function editorValue(status) {
    const tags = [...new Set(field('tags').value.split(/[,，]/).map(tag => tag.trim()).filter(Boolean))];
    if (tags.length > 5 || tags.some(tag => [...tag].length > 20)) throw new Error(t.invalid_tags);
    const value = { title: field('title').value.trim(), excerpt: field('excerpt').value.trim(), body_md: field('body_md').value, category: field('category').value, language: field('language').value, tags, body_style: bodyStyle(), status };
    if (status === 'published' && ([...value.title].length < 3 || [...value.body_md.trim()].length < 10)) throw new Error(t.invalid_post);
    return value;
  }
  async function savePost(status, { automatic = false, unpublish = false } = {}) {
    if (!isAdmin || saving || opening || autosaveBlocked) return false;
    let value;
    try { value = editorValue(status); } catch (error) { message($('#editor-message'), error.message); return false; }
    saving = true;
    const revision = editRevision;
    const controls = $$(automatic ? 'button' : 'button,input,textarea,select', editor); controls.forEach(control => control.disabled = true);
    message($('#save-state'), t.saving);
    try {
      if (post?.source_path && !post.id) {
        // Import the already-public original, then save edits privately until Publish is clicked.
        const original = staticPosts.find(item => item.source_path === post.source_path);
        const { title, excerpt, body_md, category, language, tags, body_style, source_path, published_at } = original;
        post = check(await client.from('blog_posts').insert({ title, excerpt, body_md, category, language, tags, body_style, source_path, published_at, status: 'published' }).select('*').single());
      }
      const privateDraft = post?.status === 'published' && status === 'draft' && !unpublish;
      let items;
      if (privateDraft) {
        const { status: ignored, ...content } = value;
        items = check(await client.rpc('save_blog_draft', { post_id: post.id, expected_version: post.version, content }));
      } else {
        const query = post?.id ? client.from('blog_posts').update(value).eq('id', post.id).eq('version', post.version) : client.from('blog_posts').insert(value);
        items = check(await query.select('*'));
      }
      if (!items.length) { autosaveBlocked = true; message($('#editor-message'), t.conflict); return false; }
      post = items[0]; setDirty(editRevision !== revision); editorState(); updatePreview();
      message($('#editor-message'), privateDraft ? t.pending_draft : t.saved);
      await loadAdminPosts(); return true;
    } catch (error) { if (error.code === '23505') autosaveBlocked = true; message($('#editor-message'), error.code === '23505' ? t.conflict : errorText(error)); return false; }
    finally { saving = false; controls.forEach(control => control.disabled = false); if (dirty) message($('#save-state'), t.dirty); }
  }
  if (editor) {
    editor.addEventListener('input', changed);
    editor.addEventListener('change', event => { if (event.target.tagName === 'SELECT') changed(); });
    editor.addEventListener('submit', event => { event.preventDefault(); savePost('draft'); });
    $('[data-new-post]').addEventListener('click', () => { if (!saving && !opening && confirmDiscard()) { newPost(); field('title').focus(); } });
    $('[data-publish]').addEventListener('click', () => { if (window.confirm(t.confirm_publish)) savePost('published'); });
    $('[data-unpublish]').addEventListener('click', () => savePost('draft', { unpublish: true }));
    setInterval(() => { if (isAdmin && dirty && !autosaveBlocked) savePost('draft', { automatic: true }); }, 30000);
    $('[data-delete]').addEventListener('click', async () => {
      if (!post?.id || post.source_path || saving || opening || !window.confirm(t.confirm_delete)) return;
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
    $('[data-preview]').addEventListener('click', event => {
      const preview = $('#post-preview');
      preview.hidden = !preview.hidden; event.currentTarget.setAttribute('aria-expanded', String(!preview.hidden)); updatePreview();
    });
    function insert(before, after = '') {
      const body = field('body_md'), selection = body.value.slice(body.selectionStart, body.selectionEnd);
      body.setRangeText(before + selection + after, body.selectionStart, body.selectionEnd, 'end'); body.focus(); changed();
    }
    $$('[data-format]').forEach(button => button.addEventListener('click', () => {
      const format = button.dataset.format;
      if (format === 'link') {
        const url = window.prompt(t.link_prompt, 'https://');
        try { if (url && new URL(url).protocol === 'https:') insert('[', `](${encodeURI(url).replace(/[()]/g, char => char === '(' ? '%28' : '%29')})`); } catch { /* Cancel/invalid URL leaves the text untouched. */ }
      } else {
        const pairs = { heading: ['\n\n## ', '\n'], bold: ['**','**'], italic: ['*','*'], strike: ['~~','~~'], list: ['\n- ',''], quote: ['\n> ',''], code_block: ['\n\n```\n','\n```\n'] };
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
      if (!post?.id && !await savePost('draft')) return;
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
        const posts = await allPosts();
        const sources = new Set(posts.map(item => item.source_path));
        posts.push(...staticPosts.filter(item => !sources.has(item.source_path)));
        const drafts = [];
        for (let offset = 0; ; offset += 500) {
          const batch = check(await client.from('blog_post_drafts').select('*').order('post_id').range(offset, offset + 499));
          drafts.push(...batch); if (batch.length < 500) break;
        }
        const url = URL.createObjectURL(new Blob([JSON.stringify({ exported_at: new Date().toISOString(), posts, drafts }, null, 2)], { type: 'application/json' }));
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
