-- ============================================================
-- NGAJIGAES DASHBOARD — Full Schema Migration
-- Applied via Supabase MCP 2026-06-26
-- Migrations 001–019 (applied in order)
-- ============================================================

-- 001: roles
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (name in ('leader','feed_socmed','reels_ads','curator')),
  description text,
  permissions jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.roles enable row level security;

-- 002: users
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role_id uuid not null references public.roles(id),
  avatar_url text,
  status text not null default 'active' check (status in ('active','inactive')),
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_users_role  on public.users(role_id);
create index if not exists idx_users_email on public.users(email);
alter table public.users enable row level security;

-- 003: score_settings
create table if not exists public.score_settings (
  id uuid primary key default gen_random_uuid(),
  task_weight numeric not null default 0.3,
  deadline_weight numeric not null default 0.2,
  kpi_weight numeric not null default 0.3,
  quality_weight numeric not null default 0.1,
  initiative_weight numeric not null default 0.1,
  updated_by uuid references public.users(id),
  updated_at timestamptz not null default now()
);
alter table public.score_settings enable row level security;

-- 004: trigger functions
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create or replace function public.set_updated_by()
returns trigger language plpgsql security definer set search_path = public as $$
begin new.updated_by = auth.uid(); return new; end; $$;

create trigger trg_roles_updated_at        before update on public.roles         for each row execute function public.set_updated_at();
create trigger trg_users_updated_at        before update on public.users         for each row execute function public.set_updated_at();
create trigger trg_score_settings_updated_at before update on public.score_settings for each row execute function public.set_updated_at();

-- 005: helper functions
create or replace function public.current_user_role()
returns text language sql security definer stable set search_path = public as $$
  select r.name from public.users u join public.roles r on r.id = u.role_id where u.id = auth.uid();
$$;

create or replace function public.jakarta_date(ts timestamptz)
returns date language sql immutable as $$
  select (ts at time zone 'Asia/Jakarta')::date;
$$;

-- 006: RLS roles/users/score_settings
create policy roles_leader_all        on public.roles         for all    using (public.current_user_role()='leader') with check (public.current_user_role()='leader');
create policy roles_team_select       on public.roles         for select using (true);
create policy users_leader_all        on public.users         for all    using (public.current_user_role()='leader') with check (public.current_user_role()='leader');
create policy users_own_select        on public.users         for select using (id = auth.uid());
create policy users_all_select        on public.users         for select using (true);
create policy score_settings_leader_update on public.score_settings for update using (public.current_user_role()='leader') with check (public.current_user_role()='leader');
create policy score_settings_all_select    on public.score_settings for select using (true);

-- 007: seed
insert into public.roles (name, description) values
  ('leader','Leader — akses penuh termasuk data finansial'),
  ('feed_socmed','Feed & Social Media — konten feed, daily report, KPI pribadi'),
  ('reels_ads','Reels & Ads — produksi video, iklan, KPI pribadi'),
  ('curator','Curator — validasi konten, KPI pribadi')
on conflict (name) do nothing;
insert into public.score_settings (task_weight,deadline_weight,kpi_weight,quality_weight,initiative_weight)
select 0.3,0.2,0.3,0.1,0.1 where not exists (select 1 from public.score_settings);

-- 008–019: tasks, comments, daily_reports, kpis, kpi_results, productivity_scores,
--          contents, instagram insights + views, products, sales, weekly_reviews,
--          action_plans, compute_kpi_actual, compute_productivity_score, close_weekly_review
-- (lihat MCP migration history di Supabase dashboard)
