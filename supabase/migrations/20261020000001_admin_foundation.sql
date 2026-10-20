-- Oryza admin foundation: admin users, audit log, image versions, leads, storage buckets.
-- Row Level Security is ON for every table. The website server uses the service-role key for admin writes
-- (only after checking the admin allow-list); RLS protects everything reachable with the public anon key.

-- ---------------------------------------------------------------- enums
create type public.admin_role as enum ('owner', 'editor');
create type public.image_status as enum ('uploaded', 'live', 'archived');
create type public.lead_status as enum ('new', 'contacted', 'converted', 'not_fit');

-- ---------------------------------------------------------------- admin users (allow-list)
create table public.admin_users (
  email       text primary key check (email = lower(email) and position('@' in email) > 1),
  role        public.admin_role not null default 'editor',
  active      boolean not null default true,
  added_by    text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.admin_users is 'Emails allowed into /admin, with their role. Owners manage this list.';

-- Is the signed-in user an active admin (optionally at least `min_role`)? Used by RLS policies.
create or replace function public.is_admin(min_role public.admin_role default 'editor')
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users a
    where a.email = lower(coalesce(auth.jwt() ->> 'email', ''))
      and a.active
      and (min_role = 'editor' or a.role = 'owner')
  );
$$;
revoke all on function public.is_admin(public.admin_role) from public;
grant execute on function public.is_admin(public.admin_role) to authenticated;

-- ---------------------------------------------------------------- audit log
create table public.audit_log (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  actor_email text not null,
  action      text not null check (action in (
                'image.upload', 'image.approve', 'image.replace', 'image.rollback', 'image.remove', 'image.delete',
                'image.focal', 'lead.update', 'user.add', 'user.update')),
  target      text not null,
  details     jsonb not null default '{}'::jsonb
);
create index audit_log_at_idx on public.audit_log (at desc);

-- ---------------------------------------------------------------- image versions per slot
create table public.slot_images (
  id               uuid primary key default gen_random_uuid(),
  slot_id          text not null check (slot_id ~ '^[a-z0-9-]+$'),
  version          integer not null check (version > 0),
  status           public.image_status not null default 'uploaded',
  source           text not null check (source in ('real', 'ai-illustrative')),
  original_path    text not null,
  original_width   integer not null check (original_width > 0),
  original_height  integer not null check (original_height > 0),
  original_sha256  text,
  focal_x          real not null default 0.5 check (focal_x between 0 and 1),
  focal_y          real not null default 0.5 check (focal_y between 0 and 1),
  aspects          jsonb,             -- processed files per crop, set on approval
  derived_from     uuid references public.slot_images (id) on delete set null,
  credit           text,
  checklist        jsonb,
  uploaded_by      text not null,
  uploaded_at      timestamptz not null default now(),
  approved_by      text,
  approved_at      timestamptz,
  unique (slot_id, version),
  -- A live image is always a processed, approved one.
  check (status <> 'live' or (aspects is not null and approved_by is not null and approved_at is not null))
);
create unique index slot_images_one_live_per_slot on public.slot_images (slot_id) where status = 'live';
create index slot_images_slot_idx on public.slot_images (slot_id, version desc);

-- ---------------------------------------------------------------- leads
create table public.leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  source        text not null check (source in ('contact', 'plan-builder')),
  name          text not null check (char_length(name) between 1 and 100),
  phone         text not null check (char_length(phone) between 10 and 20),
  business      text not null default '',
  category      text not null default '',
  city          text not null default '',
  message       text not null default '',
  plan_summary  text not null default '',
  answers       jsonb,
  status        public.lead_status not null default 'new',
  notes         text not null default '',
  email_sent    boolean not null default false,
  email_error   text,
  updated_at    timestamptz not null default now(),
  updated_by    text
);
create index leads_created_idx on public.leads (created_at desc);

-- ---------------------------------------------------------------- Row Level Security
alter table public.admin_users enable row level security;
alter table public.audit_log   enable row level security;
alter table public.slot_images enable row level security;
alter table public.leads       enable row level security;

-- Public visitors: only live images, and only the columns the site needs (no paths to originals, no emails).
revoke all on public.slot_images from anon;
grant select (slot_id, version, status, source, focal_x, focal_y, aspects, approved_at) on public.slot_images to anon;
create policy "public reads live images" on public.slot_images
  for select to anon using (status = 'live');

-- Signed-in admins (defence in depth; the server normally uses the service role after its own check).
create policy "admins read images"   on public.slot_images for select to authenticated using (public.is_admin());
create policy "admins read leads"    on public.leads       for select to authenticated using (public.is_admin());
create policy "admins update leads"  on public.leads       for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins read audit"    on public.audit_log   for select to authenticated using (public.is_admin());
create policy "admins read users"    on public.admin_users for select to authenticated using (public.is_admin());
create policy "owners manage users"  on public.admin_users for all to authenticated using (public.is_admin('owner')) with check (public.is_admin('owner'));

-- Nothing else is granted to anon: no access to leads, audit_log or admin_users.
revoke all on public.leads, public.audit_log, public.admin_users from anon;

-- ---------------------------------------------------------------- storage buckets
-- site-images: processed AVIF/WebP files, publicly readable (they are on the website).
-- image-originals: uploaded originals, private (admins see them through short-lived signed URLs).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('site-images', 'site-images', true, 10485760, array['image/avif', 'image/webp']),
  ('image-originals', 'image-originals', false, 26214400, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
-- No storage.objects policies are added: uploads and deletes go through the server (service role) or signed
-- upload URLs it issues; public reads of site-images work because the bucket is public.

-- ---------------------------------------------------------------- atomic "make this version live"
-- Archives the slot's current live image and promotes p_id in one transaction (p_id null = remove: slot shows
-- the brand fallback). Only the server (service role) may call it.
create or replace function public.set_live_image(p_slot text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.slot_images set status = 'archived'
    where slot_id = p_slot and status = 'live' and id is distinct from p_id;
  if p_id is not null then
    update public.slot_images set status = 'live' where id = p_id and slot_id = p_slot;
    if not found then
      raise exception 'image version % not found for slot %', p_id, p_slot;
    end if;
  end if;
end;
$$;
revoke all on function public.set_live_image(text, uuid) from public, anon, authenticated;
grant execute on function public.set_live_image(text, uuid) to service_role;
