-- Run only AFTER the owner registers and confirms this email address.
-- Browser signup and user-editable metadata cannot grant administrator access.
do $$
declare owner_id uuid;
begin
  select id into owner_id from auth.users
  where lower(email) = 'sumingwang@qq.com' and email_confirmed_at is not null;
  if owner_id is null then
    raise exception 'The owner must register and verify sumingwang@qq.com first';
  end if;
  insert into site_private.admins(user_id) values (owner_id) on conflict do nothing;
end;
$$;
