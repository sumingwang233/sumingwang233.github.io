begin;

alter table public.blog_posts add column source_path text unique
  check (source_path is null or source_path ~ '^/(en/)?(notes|journal)/[a-z0-9-]+/$');
alter table public.blog_posts add column body_style jsonb not null default '{}';

create function site_private.valid_blog_style(value jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
begin
  if value is null or jsonb_typeof(value) <> 'object' then return false; end if;
  if exists (select 1 from jsonb_object_keys(value) as keys(key) where key not in ('font_family','font_size','line_height','letter_spacing')) then return false; end if;
  return coalesce((not value ? 'font_family' or (jsonb_typeof(value->'font_family') = 'string' and value->>'font_family' in ('default','serif','sans','mono')))
    and (not value ? 'font_size' or (jsonb_typeof(value->'font_size') = 'number' and (value->>'font_size')::numeric between 14 and 28))
    and (not value ? 'line_height' or (jsonb_typeof(value->'line_height') = 'number' and (value->>'line_height')::numeric between 1.2 and 2.4))
    and (not value ? 'letter_spacing' or (jsonb_typeof(value->'letter_spacing') = 'number' and (value->>'letter_spacing')::numeric between -0.5 and 3)), false);
exception when others then return false;
end;
$$;
grant execute on function site_private.valid_blog_style(jsonb) to authenticated;
alter table public.blog_posts add constraint blog_body_style_valid check (site_private.valid_blog_style(body_style));
grant insert (source_path, body_style, published_at), update (body_style) on public.blog_posts to authenticated;

create or replace function site_private.blog_timestamps() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    new.id := old.id; new.author_id := old.author_id; new.created_at := old.created_at;
    new.source_path := old.source_path; new.version := old.version + 1; new.published_at := old.published_at;
  else
    new.version := 1; new.created_at := now();
    if new.status <> 'published' then new.published_at := null; end if;
  end if;
  new.updated_at := now();
  if new.status = 'published' then new.published_at := coalesce(new.published_at, now()); end if;
  return new;
end;
$$;

alter policy blog_admin_update on public.blog_posts using ((select public.is_site_admin())) with check ((select public.is_site_admin()));
alter policy blog_admin_delete on public.blog_posts using ((select public.is_site_admin()));

create table public.blog_post_drafts (
  post_id uuid primary key references public.blog_posts(id) on delete cascade,
  editor_id uuid not null default auth.uid() references auth.users(id),
  post_version integer not null,
  content jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.blog_post_drafts enable row level security;
revoke all on public.blog_post_drafts from public, anon, authenticated;
grant select on public.blog_post_drafts to authenticated;
create policy blog_draft_admin_read on public.blog_post_drafts for select to authenticated using ((select public.is_site_admin()));

create function site_private.clear_blog_draft() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.blog_post_drafts where post_id = new.id;
  return new;
end;
$$;
revoke all on function site_private.clear_blog_draft() from public;
create trigger clear_blog_draft after update on public.blog_posts for each row execute function site_private.clear_blog_draft();

create function public.save_blog_draft(post_id uuid, expected_version integer, content jsonb)
returns setof public.blog_posts language plpgsql security definer set search_path = '' as $$
declare saved public.blog_posts; draft_tags text[];
begin
  if not public.is_site_admin() then raise exception 'Administrator required' using errcode = '42501'; end if;
  if content is null or jsonb_typeof(content) <> 'object'
    or not content ?& array['title','excerpt','body_md','category','language','tags','body_style']
    or exists (select 1 from jsonb_object_keys(content) as keys(key) where key not in ('title','excerpt','body_md','category','language','tags','body_style'))
    or jsonb_typeof(content->'title') <> 'string' or length(content->>'title') > 160
    or jsonb_typeof(content->'excerpt') <> 'string' or length(content->>'excerpt') > 240
    or jsonb_typeof(content->'body_md') <> 'string' or length(content->>'body_md') > 100000
    or jsonb_typeof(content->'category') <> 'string' or content->>'category' not in ('essay','research','development','photography')
    or jsonb_typeof(content->'language') <> 'string' or content->>'language' not in ('zh','en') or jsonb_typeof(content->'tags') <> 'array'
    or not site_private.valid_blog_style(content->'body_style') then
    raise exception 'Invalid draft' using errcode = '22023';
  end if;
  if exists (select 1 from jsonb_array_elements(content->'tags') tag where jsonb_typeof(tag) <> 'string') then
    raise exception 'Invalid draft tags' using errcode = '22023';
  end if;
  select array_agg(tag) into draft_tags from jsonb_array_elements_text(content->'tags') tag;
  if not site_private.valid_tags(coalesce(draft_tags, '{}')) then raise exception 'Invalid draft tags' using errcode = '22023'; end if;
  update public.blog_posts set updated_at = now()
    where id = post_id and version = expected_version and status = 'published' returning * into saved;
  if not found then return; end if;
  insert into public.blog_post_drafts(post_id, editor_id, post_version, content)
    values (saved.id, auth.uid(), saved.version, content);
  return next saved;
end;
$$;
revoke all on function public.save_blog_draft(uuid, integer, jsonb) from public, anon;
grant execute on function public.save_blog_draft(uuid, integer, jsonb) to authenticated;

alter policy blog_media_create on storage.objects with check (
  bucket_id = 'blog-media' and (select public.is_site_admin())
  and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$'
  and exists (select 1 from public.blog_posts p where p.id::text = (storage.foldername(name))[1])
);
alter policy blog_media_delete on storage.objects using (
  bucket_id = 'blog-media' and (select public.is_site_admin())
  and exists (select 1 from public.blog_posts p where p.id::text = (storage.foldername(name))[1])
);
alter policy blog_media_read on storage.objects using (
  bucket_id = 'blog-media' and exists (
    select 1 from public.blog_posts p where p.id::text = (storage.foldername(name))[1]
    and ((select public.is_site_admin()) or (p.status = 'published' and position('media:' || name in p.body_md) > 0))
  )
);
commit;
