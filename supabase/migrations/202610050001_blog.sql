-- Run once in the project's SQL Editor. No Auth passwords or private emails are exposed.
begin;
create schema if not exists site_private;
revoke all on schema site_private from public, anon, authenticated;
create table site_private.admins (
  user_id uuid primary key references auth.users(id) on delete restrict
);
revoke all on site_private.admins from public, anon, authenticated;
alter table site_private.admins enable row level security;

create function public.is_site_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from site_private.admins where user_id = (select auth.uid()));
$$;
revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to anon, authenticated;

create function site_private.valid_tags(tags text[]) returns boolean
language sql immutable set search_path = '' as $$
  select cardinality(tags) <= 5 and not exists (
    select 1 from unnest(tags) as tag where tag is null or length(btrim(tag)) not between 1 and 20
  );
$$;
grant usage on schema site_private to anon, authenticated;
grant execute on function site_private.valid_tags(text[]) to authenticated;

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  title text not null default '' check (length(title) <= 160),
  excerpt text not null default '' check (length(excerpt) <= 240),
  body_md text not null default '' check (length(body_md) <= 100000),
  category text not null default 'essay' check (category in ('essay','research','development','photography')),
  tags text[] not null default '{}' check (site_private.valid_tags(tags)),
  language text not null default 'zh' check (language in ('zh','en')),
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  version integer not null default 1,
  check (status <> 'published' or (length(btrim(title)) >= 3 and length(btrim(body_md)) >= 10 and published_at is not null))
);
create index blog_posts_published_idx on public.blog_posts(published_at desc) where status = 'published';

create function site_private.blog_timestamps() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    new.id := old.id;
    new.author_id := old.author_id;
    new.created_at := old.created_at;
    new.version := old.version + 1;
    new.published_at := old.published_at;
  else
    new.version := 1;
    new.created_at := now();
    new.published_at := null;
  end if;
  new.updated_at := now();
  if new.status = 'published' then new.published_at := coalesce(new.published_at, now()); end if;
  return new;
end;
$$;
create trigger blog_timestamps before insert or update on public.blog_posts
for each row execute function site_private.blog_timestamps();

alter table public.blog_posts enable row level security;
revoke all on public.blog_posts from public, anon, authenticated;
grant select on public.blog_posts to anon, authenticated;
grant insert (title, excerpt, body_md, category, tags, language, status) on public.blog_posts to authenticated;
grant update (title, excerpt, body_md, category, tags, language, status) on public.blog_posts to authenticated;
grant delete on public.blog_posts to authenticated;
create policy blog_public_read on public.blog_posts for select to anon, authenticated
  using (status = 'published' or (select public.is_site_admin()));
create policy blog_admin_create on public.blog_posts for insert to authenticated
  with check ((select public.is_site_admin()) and author_id = (select auth.uid()));
create policy blog_admin_update on public.blog_posts for update to authenticated
  using ((select public.is_site_admin()) and author_id = (select auth.uid()))
  with check ((select public.is_site_admin()) and author_id = (select auth.uid()));
create policy blog_admin_delete on public.blog_posts for delete to authenticated
  using ((select public.is_site_admin()) and author_id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-media', 'blog-media', false, 5242880, array['image/webp']);
create policy blog_media_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'blog-media' and exists (
    select 1 from public.blog_posts p where p.id::text = (storage.foldername(name))[1]
    and (p.status = 'published' or (select public.is_site_admin()))
  ));
create policy blog_media_create on storage.objects for insert to authenticated
  with check (bucket_id = 'blog-media' and (select public.is_site_admin())
    and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$'
    and exists (select 1 from public.blog_posts p where p.id::text = (storage.foldername(name))[1] and p.author_id = (select auth.uid())));
create policy blog_media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'blog-media' and (select public.is_site_admin())
    and exists (select 1 from public.blog_posts p where p.id::text = (storage.foldername(name))[1] and p.author_id = (select auth.uid())));
commit;
