-- Operación Diseño TIBOX · V2
-- Migración aditiva: mantiene compatibilidad con los registros existentes.

do $$ begin
  create type public.work_priority as enum ('low', 'medium', 'high', 'urgent');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter type public.work_item_status add value if not exists 'in_review' after 'in_progress';
exception
  when duplicate_object then null;
end $$;

alter table public.team_members
  add column if not exists avatar_url text,
  add column if not exists weekly_capacity numeric(5,2) not null default 40 check (weekly_capacity >= 0 and weekly_capacity <= 80);

alter table public.work_items
  add column if not exists priority public.work_priority not null default 'medium',
  add column if not exists due_date date,
  add column if not exists completed_at timestamptz,
  add column if not exists parent_work_item_id uuid references public.work_items(id) on delete set null,
  add column if not exists channel text,
  add column if not exists content_type text,
  add column if not exists publish_date date,
  add column if not exists sort_order integer not null default 1000;

create index if not exists work_items_due_date_idx on public.work_items(due_date);
create index if not exists work_items_priority_idx on public.work_items(priority);
create index if not exists work_items_parent_idx on public.work_items(parent_work_item_id);
create index if not exists work_items_publish_date_idx on public.work_items(publish_date);

-- La fecha de vencimiento parte usando la fecha de término existente cuando corresponde.
update public.work_items
set due_date = end_date
where due_date is null and end_date is not null;

-- Wladimick fue concebido como administrador desde el diseño inicial.
update public.profiles
set role = 'admin', full_name = 'Wladimick Díaz', updated_at = now()
where email = 'wdiaz@tibox.cl';

-- Javier Toledo se incorpora al equipo de Diseño/RRSS. El avatar puede cargarse después.
insert into public.team_members (
  full_name, short_name, area, role_title, active, sort_order, weekly_capacity
)
select 'Javier Toledo', 'Javier', 'Diseño', 'Diseño / Redes Sociales', true, 15, 40
where not exists (
  select 1 from public.team_members where lower(short_name) = 'javier'
);

-- Mantener fechas de cierre consistentes al cambiar estado desde la app.
create or replace function public.set_work_item_metrics()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.start_date is not null and new.end_date is not null and new.end_date >= new.start_date then
    new.duration_weeks := greatest(1, ceil(((new.end_date - new.start_date + 1)::numeric) / 7));
  else
    new.duration_weeks := greatest(coalesce(new.duration_weeks, 1), 1);
  end if;
  new.hh_weekly := round(new.hh_total / new.duration_weeks, 3);
  if new.status = 'completed' and new.completed_at is null then
    new.completed_at := now();
  elsif new.status <> 'completed' then
    new.completed_at := null;
  end if;
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

create or replace function public.touch_daily_task()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;
