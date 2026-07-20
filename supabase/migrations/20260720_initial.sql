-- Control Diseño TI · TIBOX
-- Ejecutar completo en Supabase SQL Editor.

create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'editor', 'viewer');
create type public.work_item_type as enum ('task', 'requirement', 'project', 'prospect', 'support');
create type public.work_item_size as enum ('pending', 'small', 'large');
create type public.work_item_status as enum ('inbox', 'planned', 'in_progress', 'blocked', 'completed', 'archived', 'discarded');
create type public.work_item_source as enum ('manual', 'support', 'projects', 'email', 'commercial', 'other');
create type public.work_category as enum ('external', 'internal');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.app_role not null default 'editor',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  short_name text not null unique,
  area text not null,
  role_title text,
  email text,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create table public.work_items (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  client_name text not null,
  title text not null,
  description text,
  type public.work_item_type not null default 'task',
  size public.work_item_size not null default 'pending',
  status public.work_item_status not null default 'inbox',
  source public.work_item_source not null default 'manual',
  source_reference text,
  source_url text,
  area text not null default 'Diseño',
  category public.work_category not null default 'external',
  start_date date,
  end_date date,
  duration_weeks numeric(8,2) not null default 1 check (duration_weeks > 0),
  hh_total numeric(10,2) not null default 0 check (hh_total >= 0),
  hh_weekly numeric(10,3) not null default 0 check (hh_weekly >= 0),
  report_to_cesar boolean not null default false,
  reported_at timestamptz,
  comments text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.work_item_assignments (
  id uuid primary key default gen_random_uuid(),
  work_item_id uuid not null references public.work_items(id) on delete cascade,
  team_member_id uuid not null references public.team_members(id) on delete restrict,
  percentage numeric(5,4) not null check (percentage > 0 and percentage <= 1),
  created_at timestamptz not null default now(),
  unique (work_item_id, team_member_id)
);

create index work_items_status_idx on public.work_items(status);
create index work_items_report_idx on public.work_items(report_to_cesar);
create index work_items_updated_idx on public.work_items(updated_at desc);
create index assignments_item_idx on public.work_item_assignments(work_item_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, coalesce(new.email, ''), coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer set search_path = ''
as $$
  select coalesce((select role from public.profiles where id = auth.uid() and active), 'viewer'::public.app_role);
$$;

create or replace function public.set_work_item_metrics()
returns trigger
language plpgsql
as $$
begin
  if new.start_date is not null and new.end_date is not null and new.end_date >= new.start_date then
    new.duration_weeks := greatest(1, ceil(((new.end_date - new.start_date + 1)::numeric) / 7));
  else
    new.duration_weeks := greatest(coalesce(new.duration_weeks, 1), 1);
  end if;
  new.hh_weekly := round(new.hh_total / new.duration_weeks, 3);
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

create trigger work_items_metrics_before_write
before insert or update on public.work_items
for each row execute procedure public.set_work_item_metrics();

alter table public.profiles enable row level security;
alter table public.team_members enable row level security;
alter table public.work_items enable row level security;
alter table public.work_item_assignments enable row level security;

create policy "authenticated read profiles" on public.profiles for select to authenticated using (true);
create policy "authenticated read team" on public.team_members for select to authenticated using (true);
create policy "admins manage team" on public.team_members for all to authenticated using (public.current_app_role() = 'admin') with check (public.current_app_role() = 'admin');

create policy "authenticated read work" on public.work_items for select to authenticated using (true);
create policy "editors insert work" on public.work_items for insert to authenticated with check (public.current_app_role() in ('admin', 'editor'));
create policy "editors update work" on public.work_items for update to authenticated using (public.current_app_role() in ('admin', 'editor')) with check (public.current_app_role() in ('admin', 'editor'));
create policy "admins delete work" on public.work_items for delete to authenticated using (public.current_app_role() = 'admin');

create policy "authenticated read assignments" on public.work_item_assignments for select to authenticated using (true);
create policy "editors insert assignments" on public.work_item_assignments for insert to authenticated with check (public.current_app_role() in ('admin', 'editor'));
create policy "editors update assignments" on public.work_item_assignments for update to authenticated using (public.current_app_role() in ('admin', 'editor')) with check (public.current_app_role() in ('admin', 'editor'));
create policy "editors delete assignments" on public.work_item_assignments for delete to authenticated using (public.current_app_role() in ('admin', 'editor'));

-- Después de crear los usuarios en Authentication > Users:
-- update public.profiles set role = 'admin', full_name = 'Wladimick Díaz' where email = 'wdiaz@tibox.cl';
-- update public.profiles set role = 'editor', full_name = 'Braulio Castro' where email = 'REEMPLAZAR_CORREO_BRAULIO';
-- update public.profiles set role = 'viewer', full_name = 'César Medina' where email = 'REEMPLAZAR_CORREO_CESAR';
