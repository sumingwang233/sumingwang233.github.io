/* Run the actual migration against PostgreSQL in-process; no remote test users. */
const { PGlite } = require('@electric-sql/pglite');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const db = new PGlite();
  const owner = '11111111-1111-4111-8111-111111111111';
  const member = '22222222-2222-4222-8222-222222222222';
  const media = '33333333-3333-4333-8333-333333333333.webp';
  try {
    await db.exec(`
      create role anon; create role authenticated;
      create schema auth; create schema storage;
      create table auth.users (id uuid primary key, email text, email_confirmed_at timestamptz, raw_user_meta_data jsonb);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      grant usage on schema auth, storage to anon, authenticated;
      grant execute on function auth.uid() to anon, authenticated;
      create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
      create table storage.objects (id uuid default gen_random_uuid() primary key, bucket_id text, name text);
      alter table storage.objects enable row level security;
      grant select, insert, delete on storage.objects to anon, authenticated;
      create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1, '/') $$;
      insert into auth.users values
        ('${owner}', 'sumingwang@qq.com', now(), '{}'),
        ('${member}', 'member@example.test', now(), '{"role":"admin","email":"sumingwang@qq.com"}');
    `);
    await db.exec(fs.readFileSync(path.join(__dirname, '../supabase/migrations/202610050001_blog.sql'), 'utf8'));
    await db.exec(fs.readFileSync(path.join(__dirname, '../supabase/admin-bootstrap.sql'), 'utf8'));
    const as = async (role, id = '') => {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
      await db.exec(`set role ${role}`);
    };
    const denied = async (sql, params = []) => {
      await assert.rejects(() => db.query(sql, params));
    };
    await as('authenticated', member);
    assert.equal((await db.query('select public.is_site_admin() as admin')).rows[0].admin, false);
    await denied('insert into site_private.admins values ($1)', [member]);
    await denied("insert into blog_posts (title) values ('Member draft')");
    await as('anon');
    await denied("insert into blog_posts (title) values ('Guest draft')");
    await as('authenticated', owner);
    assert.equal((await db.query('select public.is_site_admin() as admin')).rows[0].admin, true);
    const post = (await db.query("insert into blog_posts (title, body_md) values ('Private draft', 'A real draft body') returning *")).rows[0];
    assert.equal(post.author_id, owner);
    assert.equal(post.status, 'draft');
    await denied('insert into blog_posts (author_id, title) values ($1, $2)', [member, 'Forged author']);
    await denied("update blog_posts set author_id = $1 where id = $2", [member, post.id]);
    await denied("update blog_posts set tags = array[''] where id = $1", [post.id]);
    await denied("insert into blog_posts (status) values ('published')");
    await db.query('insert into storage.objects (bucket_id, name) values ($1,$2)', ['blog-media', `${post.id}/${media}`]);
    await as('anon');
    assert.equal((await db.query('select * from blog_posts')).rows.length, 0);
    assert.equal((await db.query('select * from storage.objects')).rows.length, 0);
    await as('authenticated', member);
    assert.equal((await db.query('select * from blog_posts')).rows.length, 0);
    assert.equal((await db.query('update blog_posts set title = $1 where id = $2 returning id', ['Hijacked',post.id])).rows.length, 0);
    assert.equal((await db.query('delete from blog_posts where id = $1 returning id', [post.id])).rows.length, 0);
    await denied('insert into storage.objects (bucket_id, name) values ($1,$2)', ['blog-media', `${post.id}/${media}`]);
    await as('authenticated', owner);
    await denied('insert into storage.objects (bucket_id, name) values ($1,$2)', ['blog-media', `${post.id}/unsafe.svg`]);
    const published = (await db.query("update blog_posts set status = 'published' where id = $1 and version = $2 returning *", [post.id, post.version])).rows[0];
    assert.equal(published.version, 2);
    assert(published.published_at);
    assert.equal((await db.query("update blog_posts set title = 'Stale write' where id = $1 and version = $2 returning *", [post.id,post.version])).rows.length, 0);
    await as('anon');
    assert.equal((await db.query('select * from blog_posts')).rows.length, 1);
    assert.equal((await db.query('select * from storage.objects')).rows.length, 1);
    await as('authenticated', owner);
    await db.query("update blog_posts set status = 'draft' where id = $1", [post.id]);
    await as('anon');
    assert.equal((await db.query('select * from blog_posts')).rows.length, 0);
    assert.equal((await db.query('select * from storage.objects')).rows.length, 0);
    console.log('PASS: PostgreSQL migration, verified owner bootstrap, RLS, draft/media privacy, author identity, publication constraints and version conflicts');
  } finally { await db.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
