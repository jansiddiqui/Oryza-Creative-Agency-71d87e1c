-- Oryza client operations: clients, monthly plans, content items, tasks, shoot days, onboarding, team and
-- deadline rules. Row Level Security is ON for every table: the public (anon) gets nothing; signed-in admins can
-- read and work; owners manage the team, rules and settings. The website server writes with the service role
-- after its own admin check (same model as the admin foundation).

-- ---------------------------------------------------------------- enums
create type public.client_status as enum ('onboarding', 'active', 'paused', 'ended');
create type public.plan_status   as enum ('draft', 'approved');
create type public.item_stage    as enum ('planned', 'in_production', 'client_review', 'approved', 'scheduled', 'published', 'done');
create type public.task_status   as enum ('todo', 'in_progress', 'done', 'blocked');
create type public.team_role     as enum ('strategist', 'designer', 'shooter', 'editor', 'community');
create type public.shoot_status  as enum ('planned', 'done', 'cancelled');

-- ---------------------------------------------------------------- team members (linked to admin users)
create table public.team_members (
  email         text primary key references public.admin_users (email) on update cascade on delete cascade,
  display_name  text not null default '' check (char_length(display_name) <= 80),
  roles         public.team_role[] not null default '{}',
  working_days  smallint[] not null default '{1,2,3,4,5,6}' check (working_days <@ '{0,1,2,3,4,5,6}'::smallint[]),
  active        boolean not null default true,
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------- clients
create table public.clients (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (char_length(name) between 1 and 120),
  category        text not null default '' check (category ~ '^[a-z0-9-]*$'),
  contact_person  text not null default '' check (char_length(contact_person) <= 100),
  phone           text not null default '' check (char_length(phone) <= 20),
  email           text not null default '' check (char_length(email) <= 120),
  city            text not null default '' check (char_length(city) <= 80),
  package         text not null default 'growth' check (package in ('starter', 'growth', 'premium')),
  start_date      date not null,
  renewal_date    date,
  status          public.client_status not null default 'onboarding',
  colour          text not null default '#8f5e0a' check (colour ~ '^#[0-9a-f]{6}$'),
  notes           text not null default '' check (char_length(notes) <= 8000),
  lead_id         uuid references public.leads (id) on delete set null,
  created_at      timestamptz not null default now(),
  created_by      text not null,
  updated_at      timestamptz not null default now(),
  updated_by      text
);
create unique index clients_one_per_lead on public.clients (lead_id) where lead_id is not null;

-- ---------------------------------------------------------------- monthly plans
create table public.client_plans (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients (id) on delete cascade,
  month_start     date not null,
  answers         jsonb not null,
  generated       jsonb not null,            -- the engine's output, exactly as generated (never edited)
  draft           jsonb not null,            -- the editable copy (items, shoots, compliance)
  engine_version  text not null,
  status          public.plan_status not null default 'draft',
  approved_by     text,
  approved_at     timestamptz,
  created_at      timestamptz not null default now(),
  created_by      text not null,
  updated_at      timestamptz not null default now(),
  unique (client_id, month_start),
  check (status <> 'approved' or (approved_by is not null and approved_at is not null))
);

-- ---------------------------------------------------------------- content items (one per calendar item)
create table public.content_items (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid not null references public.clients (id) on delete cascade,
  plan_id             uuid not null references public.client_plans (id) on delete cascade,
  draft_item_id       text not null,
  platform            text not null,
  format              text not null,
  title               text not null check (char_length(title) <= 200),
  hook                text not null default '' check (char_length(hook) <= 500),
  cta                 text not null default '' check (char_length(cta) <= 200),
  pillar              text not null default '',
  template_id         text not null default '',
  publish_date        date not null,
  publish_time        text not null default '',
  stage               public.item_stage not null default 'planned',
  assignee            text references public.admin_users (email) on update cascade on delete set null,
  caption_draft       text not null default '' check (char_length(caption_draft) <= 4000),
  asset_links         text[] not null default '{}',
  notes               text not null default '' check (char_length(notes) <= 4000),
  compliance_notes    text not null default '',
  client_approved_at  timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (plan_id, draft_item_id)
);
create index content_items_date_idx on public.content_items (publish_date);
create index content_items_client_idx on public.content_items (client_id, publish_date);

-- Compliance notes come from the plan and can never be changed or removed.
create or replace function public.keep_compliance_notes()
returns trigger
language plpgsql
as $$
begin
  if new.compliance_notes is distinct from old.compliance_notes then
    raise exception 'compliance notes cannot be changed or removed';
  end if;
  return new;
end;
$$;
create trigger content_items_keep_compliance
  before update of compliance_notes on public.content_items
  for each row execute function public.keep_compliance_notes();

-- The same for a plan's draft: plan-level and per-item compliance notes must stay as generated.
create or replace function public.keep_plan_compliance()
returns trigger
language plpgsql
as $$
declare
  kept boolean;
begin
  if new.draft -> 'compliance' is distinct from old.draft -> 'compliance' then
    raise exception 'plan compliance notes cannot be changed or removed';
  end if;
  -- Every item that is still in the draft keeps its original compliance note.
  select coalesce(bool_and(n.value ->> 'complianceNote' is not distinct from o.value ->> 'complianceNote'), true)
    into kept
    from jsonb_array_elements(new.draft -> 'items') n
    join jsonb_array_elements(old.draft -> 'items') o on o.value ->> 'id' = n.value ->> 'id';
  if not kept then
    raise exception 'an item''s compliance note cannot be changed or removed';
  end if;
  return new;
end;
$$;
create trigger client_plans_keep_compliance
  before update of draft on public.client_plans
  for each row execute function public.keep_plan_compliance();

-- ---------------------------------------------------------------- tasks
create table public.tasks (
  id              uuid primary key default gen_random_uuid(),
  item_id         uuid not null references public.content_items (id) on delete cascade,
  client_id       uuid not null references public.clients (id) on delete cascade,
  step            text not null check (step ~ '^[a-z_]+$'),
  label           text not null,
  due_date        date not null,
  due_time        text not null default '',
  role            public.team_role not null,
  assignee        text references public.admin_users (email) on update cascade on delete set null,
  status          public.task_status not null default 'todo',
  late            boolean not null default false,
  blocked_reason  text not null default '' check (char_length(blocked_reason) <= 500),
  note            text not null default '' check (char_length(note) <= 2000),
  completed_by    text,
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (item_id, step),
  check (status <> 'blocked' or blocked_reason <> ''),
  check (status <> 'done' or (completed_by is not null and completed_at is not null))
);
create index tasks_due_idx on public.tasks (due_date) where status <> 'done';
create index tasks_assignee_idx on public.tasks (assignee, due_date);

-- ---------------------------------------------------------------- shoot days
create table public.shoot_days (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients (id) on delete cascade,
  plan_id     uuid references public.client_plans (id) on delete cascade,
  shoot_date  date not null,
  label       text not null default 'Shoot day',
  shot_list   text[] not null default '{}',
  location    text not null default '' check (char_length(location) <= 200),
  shooter     text references public.admin_users (email) on update cascade on delete set null,
  status      public.shoot_status not null default 'planned',
  created_at  timestamptz not null default now()
);
create index shoot_days_date_idx on public.shoot_days (shoot_date);

-- ---------------------------------------------------------------- onboarding checklist
create table public.onboarding_items (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients (id) on delete cascade,
  kind        text not null check (kind in ('access', 'consent', 'assets', 'optimization')),
  label       text not null check (char_length(label) between 1 and 200),
  platform    text not null default '',
  done        boolean not null default false,
  done_by     text,
  done_at     timestamptz,
  note        text not null default '' check (char_length(note) <= 1000),
  unique (client_id, kind, label)
);

-- ---------------------------------------------------------------- deadline rules + settings (owners edit)
create table public.deadline_rules (
  format  text not null check (format ~ '^[a-z]+$'),
  step    text not null check (step ~ '^[a-z_]+$'),
  label   text not null check (char_length(label) between 1 and 60),
  offset_days smallint not null check (offset_days between -30 and 7),
  due_time    text not null default '',
  role    public.team_role not null,
  sort    smallint not null default 1,
  primary key (format, step)
);

create table public.ops_settings (
  id            smallint primary key default 1 check (id = 1),
  working_days  smallint[] not null default '{1,2,3,4,5,6}' check (working_days <@ '{0,1,2,3,4,5,6}'::smallint[] and cardinality(working_days) > 0),
  updated_at    timestamptz not null default now(),
  updated_by    text
);
insert into public.ops_settings (id) values (1);

insert into public.deadline_rules (format, step, label, offset_days, due_time, role, sort) values
  ('reel', 'script', 'Script', -5, '6:00 pm', 'strategist', 1),
  ('reel', 'shoot', 'Shoot', -3, '6:00 pm', 'shooter', 2),
  ('reel', 'edit', 'Edit', -2, '6:00 pm', 'editor', 3),
  ('reel', 'client_approval', 'Client approval', -1, '1:00 pm', 'strategist', 4),
  ('reel', 'schedule', 'Schedule', -1, '6:00 pm', 'community', 5),
  ('reel', 'publish', 'Publish', 0, '', 'community', 6),
  ('reel', 'post_check', 'Post-check', 1, '6:00 pm', 'community', 7),
  ('post', 'copy', 'Copy', -4, '6:00 pm', 'strategist', 1),
  ('post', 'design', 'Design', -3, '6:00 pm', 'designer', 2),
  ('post', 'client_approval', 'Client approval', -1, '1:00 pm', 'strategist', 3),
  ('post', 'schedule', 'Schedule', -1, '6:00 pm', 'community', 4),
  ('post', 'publish', 'Publish', 0, '', 'community', 5),
  ('story', 'prepare', 'Prepare', -1, '6:00 pm', 'designer', 1),
  ('story', 'publish', 'Publish', 0, '', 'community', 2),
  ('short', 'edit', 'Cut the Short', -1, '6:00 pm', 'editor', 1),
  ('short', 'publish', 'Publish', 0, '', 'community', 2),
  ('video', 'edit', 'Edit', -4, '6:00 pm', 'editor', 1),
  ('video', 'client_approval', 'Client approval', -2, '1:00 pm', 'strategist', 2),
  ('video', 'publish', 'Publish', 0, '', 'community', 3),
  ('blog', 'draft', 'Draft', -5, '6:00 pm', 'strategist', 1),
  ('blog', 'client_approval', 'Client approval', -2, '1:00 pm', 'strategist', 2),
  ('blog', 'publish', 'Publish', 0, '', 'community', 3),
  ('gpost', 'copy', 'Copy and photo', -2, '6:00 pm', 'strategist', 1),
  ('gpost', 'publish', 'Publish', 0, '', 'community', 2),
  ('broadcast', 'copy', 'Write the message', -1, '1:00 pm', 'strategist', 1),
  ('broadcast', 'publish', 'Send', 0, '', 'community', 2),
  ('status', 'prepare', 'Prepare', -1, '6:00 pm', 'designer', 1),
  ('status', 'publish', 'Publish', 0, '', 'community', 2),
  ('event', 'prepare', 'Set up the event', -1, '1:00 pm', 'community', 1),
  ('event', 'publish', 'Publish', 0, '', 'community', 2),
  ('pin', 'design', 'Design pins', -2, '6:00 pm', 'designer', 1),
  ('pin', 'publish', 'Publish', 0, '', 'community', 2),
  ('default', 'prepare', 'Prepare', -1, '6:00 pm', 'community', 1),
  ('default', 'publish', 'Publish', 0, '', 'community', 2);

-- ---------------------------------------------------------------- audit log: new actions
alter table public.audit_log drop constraint audit_log_action_check;
alter table public.audit_log add constraint audit_log_action_check check (action in (
  'image.upload', 'image.approve', 'image.replace', 'image.rollback', 'image.remove', 'image.delete',
  'image.focal', 'lead.update', 'user.add', 'user.update',
  'client.create', 'client.update', 'plan.generate', 'plan.edit', 'plan.approve',
  'item.move', 'item.update', 'task.update', 'shoot.update', 'onboarding.update',
  'team.update', 'rules.update', 'settings.update'));

-- ---------------------------------------------------------------- Row Level Security
alter table public.team_members     enable row level security;
alter table public.clients          enable row level security;
alter table public.client_plans     enable row level security;
alter table public.content_items    enable row level security;
alter table public.tasks            enable row level security;
alter table public.shoot_days       enable row level security;
alter table public.onboarding_items enable row level security;
alter table public.deadline_rules   enable row level security;
alter table public.ops_settings     enable row level security;

-- The public gets nothing.
revoke all on public.team_members, public.clients, public.client_plans, public.content_items, public.tasks,
  public.shoot_days, public.onboarding_items, public.deadline_rules, public.ops_settings from anon;

-- Signed-in staff (active admins) work with client data.
create policy "staff read clients"        on public.clients          for select to authenticated using (public.is_admin());
create policy "staff write clients"       on public.clients          for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "staff read plans"          on public.client_plans     for select to authenticated using (public.is_admin());
create policy "staff write plans"         on public.client_plans     for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "staff read items"          on public.content_items    for select to authenticated using (public.is_admin());
create policy "staff write items"         on public.content_items    for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "staff read tasks"          on public.tasks            for select to authenticated using (public.is_admin());
create policy "staff write tasks"         on public.tasks            for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "staff read shoots"         on public.shoot_days       for select to authenticated using (public.is_admin());
create policy "staff write shoots"        on public.shoot_days       for all    to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "staff read onboarding"     on public.onboarding_items for select to authenticated using (public.is_admin());
create policy "staff write onboarding"    on public.onboarding_items for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- Team, deadline rules and settings: everyone on staff reads; only owners change them.
create policy "staff read team"           on public.team_members     for select to authenticated using (public.is_admin());
create policy "owners manage team"        on public.team_members     for all    to authenticated using (public.is_admin('owner')) with check (public.is_admin('owner'));
create policy "staff read rules"          on public.deadline_rules   for select to authenticated using (public.is_admin());
create policy "owners manage rules"       on public.deadline_rules   for all    to authenticated using (public.is_admin('owner')) with check (public.is_admin('owner'));
create policy "staff read settings"       on public.ops_settings     for select to authenticated using (public.is_admin());
create policy "owners manage settings"    on public.ops_settings     for update to authenticated using (public.is_admin('owner')) with check (public.is_admin('owner'));
