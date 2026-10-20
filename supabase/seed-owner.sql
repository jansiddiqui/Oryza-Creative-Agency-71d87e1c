-- Run ONCE after the migration, with your own email (lower case), to create the first owner.
-- The owner can then add editors and other owners from /admin/users.
insert into public.admin_users (email, role, added_by)
values ('YOUR-EMAIL@example.com', 'owner', 'seed')
on conflict (email) do update set role = 'owner', active = true;
