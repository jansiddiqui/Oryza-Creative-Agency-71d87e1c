-- Phase 4B: team workload and leave, shoot-day planner, client approval links, reminders, monthly reports,
-- billing (tracking only). Same model as before: Row Level Security on every table, nothing for anon, staff read
-- and work, owners manage settings and money. Client approval and report links are served by the website server
-- (service role) only after it has checked the link's signature, expiry and revocation.

-- ---------------------------------------------------------------- team: capacity, estimates, digest opt-out, leave
alter table public.ops_settings add column capacity_hours numeric(4, 1) not null default 7 check (capacity_hours between 1 and 16);
alter table public.team_members add column digest_opt_out boolean not null default false;
alter table public.team_members add column capacity_hours numeric(4, 1) check (capacity_hours is null or capacity_hours between 1 and 16);

-- Estimated hours per task step (owners edit them in Settings).
create table public.task_estimates (
  step   text primary key check (step ~ '^[a-z_]+$'),
  hours  numeric(4, 2) not null check (hours >= 0 and hours <= 24)
);
insert into public.task_estimates (step, hours) values
  ('script', 1), ('shoot', 3), ('edit', 2.5), ('client_approval', 0.25), ('schedule', 0.25), ('publish', 0.25),
  ('post_check', 0.25), ('copy', 0.75), ('design', 1.5), ('prepare', 0.5), ('draft', 2), ('default', 0.5);

create table public.team_leave (
  id          uuid primary key default gen_random_uuid(),
  email       text not null references public.admin_users (email) on update cascade on delete cascade,
  start_date  date not null,
  end_date    date not null,
  note        text not null default '' check (char_length(note) <= 200),
  created_by  text not null,
  created_at  timestamptz not null default now(),
  check (end_date >= start_date)
);
create index team_leave_email_idx on public.team_leave (email, start_date);

-- ---------------------------------------------------------------- shoot-day planner
alter table public.shoot_days add column start_time text not null default '' check (start_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$|^$');
alter table public.shoot_days add column end_time   text not null default '' check (end_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$|^$');
alter table public.shoot_days add column props      text not null default '' check (char_length(props) <= 2000);
alter table public.shoot_days add column people     text not null default '' check (char_length(people) <= 2000);
alter table public.shoot_days add column notes      text not null default '' check (char_length(notes) <= 2000);

-- The merged shot list: one row per shot, linked to the content item it feeds (null = general shot).
create table public.shoot_shots (
  id        uuid primary key default gen_random_uuid(),
  shoot_id  uuid not null references public.shoot_days (id) on delete cascade,
  item_id   uuid references public.content_items (id) on delete cascade,
  label     text not null check (char_length(label) between 1 and 300),
  sort      smallint not null default 0,
  done      boolean not null default false,
  done_by   text,
  done_at   timestamptz,
  unique nulls not distinct (shoot_id, item_id, label)
);
create index shoot_shots_shoot_idx on public.shoot_shots (shoot_id, sort);

-- ---------------------------------------------------------------- client assets (private; shown via signed URLs)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('client-assets', 'client-assets', false, 104857600,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm', 'application/pdf'])
on conflict (id) do nothing;

-- ---------------------------------------------------------------- client approval links
create table public.approval_links (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients (id) on delete cascade,
  item_ids        uuid[] not null check (cardinality(item_ids) between 1 and 60),
  label           text not null default '' check (char_length(label) <= 120),
  expires_at      timestamptz not null,
  revoked_at      timestamptz,
  revoked_by      text,
  created_by      text not null,
  created_at      timestamptz not null default now(),
  last_reminded_at timestamptz,
  first_response_at timestamptz
);
create index approval_links_client_idx on public.approval_links (client_id, created_at desc);

create table public.approval_responses (
  id         bigint generated always as identity primary key,
  link_id    uuid not null references public.approval_links (id) on delete cascade,
  item_id    uuid not null references public.content_items (id) on delete cascade,
  decision   text not null check (decision in ('approved', 'changes')),
  comment    text not null default '' check (char_length(comment) <= 2000),
  at         timestamptz not null default now(),
  check (decision = 'approved' or comment <> '')
);
create index approval_responses_link_idx on public.approval_responses (link_id, item_id, at desc);

-- ---------------------------------------------------------------- rate limiting for public link pages
create table public.rate_limits (
  key           text primary key check (char_length(key) <= 200),
  window_start  timestamptz not null,
  hits          integer not null
);

-- Counts one hit for `p_key`; true while the key is within `p_max` hits per `p_window` seconds. Atomic.
create or replace function public.rate_hit(p_key text, p_max integer, p_window integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  insert into public.rate_limits as r (key, window_start, hits) values (p_key, now(), 1)
  on conflict (key) do update
    set hits = case when r.window_start < now() - make_interval(secs => p_window) then 1 else r.hits + 1 end,
        window_start = case when r.window_start < now() - make_interval(secs => p_window) then now() else r.window_start end
  returning hits into n;
  return n <= p_max;
end;
$$;
revoke all on function public.rate_hit(text, integer, integer) from public, anon, authenticated;

-- ---------------------------------------------------------------- reminders (so each one is sent once)
create table public.reminder_log (
  kind     text not null check (kind in ('digest', 'approval', 'renewal')),
  ref      text not null check (char_length(ref) <= 200),
  sent_on  date not null,
  at       timestamptz not null default now(),
  ok       boolean not null default true,
  detail   text not null default '' check (char_length(detail) <= 500),
  primary key (kind, ref, sent_on)
);

-- ---------------------------------------------------------------- monthly reports (numbers entered by the team)
create table public.monthly_reports (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients (id) on delete cascade,
  month       date not null check (extract(day from month) = 1),
  metrics     jsonb not null default '{}'::jsonb,   -- {platform: {metric: number}} — only what was recorded
  notes       text not null default '' check (char_length(notes) <= 4000),
  next_focus  text not null default '' check (char_length(next_focus) <= 2000),
  top_items   uuid[] not null default '{}' check (cardinality(top_items) <= 3),
  updated_by  text not null,
  updated_at  timestamptz not null default now(),
  unique (client_id, month)
);

create table public.report_links (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references public.monthly_reports (id) on delete cascade,
  expires_at  timestamptz not null,
  revoked_at  timestamptz,
  created_by  text not null,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- billing (tracking only; owners only)
create table public.client_billing (
  client_id         uuid primary key references public.clients (id) on delete cascade,
  monthly_fee       numeric(12, 2) check (monthly_fee is null or monthly_fee >= 0),
  optimization_fee  numeric(12, 2) check (optimization_fee is null or optimization_fee >= 0),
  updated_by        text not null,
  updated_at        timestamptz not null default now()
);

create table public.invoices (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients (id) on delete cascade,
  number     text not null unique check (char_length(number) between 1 and 40),
  issued_on  date not null,
  due_on     date not null,
  amount     numeric(12, 2) not null check (amount >= 0),
  status     text not null default 'due' check (status in ('due', 'paid', 'overdue')),
  paid_on    date,
  mode       text not null default '' check (mode in ('', 'upi', 'bank', 'cash', 'cheque', 'card', 'other')),
  notes      text not null default '' check (char_length(notes) <= 1000),
  created_by text not null,
  created_at timestamptz not null default now(),
  check (due_on >= issued_on),
  check (status <> 'paid' or paid_on is not null)
);
create index invoices_client_idx on public.invoices (client_id, issued_on desc);

-- ---------------------------------------------------------------- audit log: new actions
alter table public.audit_log drop constraint audit_log_action_check;
alter table public.audit_log add constraint audit_log_action_check check (action in (
  'image.upload', 'image.approve', 'image.replace', 'image.rollback', 'image.remove', 'image.delete',
  'image.focal', 'lead.update', 'user.add', 'user.update',
  'client.create', 'client.update', 'plan.generate', 'plan.edit', 'plan.approve',
  'item.move', 'item.update', 'task.update', 'shoot.update', 'onboarding.update',
  'team.update', 'rules.update', 'settings.update',
  'task.reassign', 'leave.update', 'estimates.update', 'shoot.move', 'shot.update', 'asset.add', 'asset.remove',
  'approval.create', 'approval.revoke', 'approval.send', 'client.approved', 'client.changes_requested',
  'reminder.sent', 'report.update', 'report.share', 'billing.update', 'invoice.update'));

-- ---------------------------------------------------------------- Row Level Security
alter table public.task_estimates     enable row level security;
alter table public.team_leave         enable row level security;
alter table public.shoot_shots        enable row level security;
alter table public.approval_links     enable row level security;
alter table public.approval_responses enable row level security;
alter table public.rate_limits        enable row level security;
alter table public.reminder_log       enable row level security;
alter table public.monthly_reports    enable row level security;
alter table public.report_links       enable row level security;
alter table public.client_billing     enable row level security;
alter table public.invoices           enable row level security;

revoke all on public.task_estimates, public.team_leave, public.shoot_shots, public.approval_links,
  public.approval_responses, public.rate_limits, public.reminder_log, public.monthly_reports, public.report_links,
  public.client_billing, public.invoices from anon;

-- Staff work with leave, shots, approval links, reports.
create policy "staff read leave"       on public.team_leave         for select to authenticated using (public.is_admin());
create policy "staff write leave"      on public.team_leave         for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "staff read shots"       on public.shoot_shots        for select to authenticated using (public.is_admin());
create policy "staff write shots"      on public.shoot_shots        for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "staff read links"       on public.approval_links     for select to authenticated using (public.is_admin());
create policy "staff write links"      on public.approval_links     for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "staff read responses"   on public.approval_responses for select to authenticated using (public.is_admin());
create policy "staff read reports"     on public.monthly_reports    for select to authenticated using (public.is_admin());
create policy "staff write reports"    on public.monthly_reports    for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "staff read report links"  on public.report_links     for select to authenticated using (public.is_admin());
create policy "staff write report links" on public.report_links     for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "staff read reminders"   on public.reminder_log       for select to authenticated using (public.is_admin());

-- Estimates: staff read, owners change.
create policy "staff read estimates"   on public.task_estimates     for select to authenticated using (public.is_admin());
create policy "owners manage estimates" on public.task_estimates    for all    to authenticated using (public.is_admin('owner')) with check (public.is_admin('owner'));

-- Money: owners only.
create policy "owners read billing"    on public.client_billing     for select to authenticated using (public.is_admin('owner'));
create policy "owners write billing"   on public.client_billing     for all    to authenticated using (public.is_admin('owner')) with check (public.is_admin('owner'));
create policy "owners read invoices"   on public.invoices           for select to authenticated using (public.is_admin('owner'));
create policy "owners write invoices"  on public.invoices           for all    to authenticated using (public.is_admin('owner')) with check (public.is_admin('owner'));

-- rate_limits: no policies at all (only the server's rate_hit function touches it).
-- approval_responses: written only by the server after it has verified a link (no insert policy for anyone).
