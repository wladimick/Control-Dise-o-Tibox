-- Tareas diarias · Control Diseño TI
-- Ejecutar en Supabase SQL Editor después de 20260720_initial.sql.

create type public.daily_task_status as enum ('pending', 'done', 'blocked');

create table public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  team_member_id uuid not null references public.team_members(id) on delete restrict,
  work_item_id uuid references public.work_items(id) on delete set null,
  task_date date not null default current_date,
  client_name text not null,
  description text not null,
  hours numeric(6,2) not null default 0 check (hours > 0 and hours <= 24),
  source public.work_item_source not null default 'manual',
  source_reference text,
  source_url text,
  status public.daily_task_status not null default 'done',
  comments text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index daily_tasks_member_date_idx on public.daily_tasks(team_member_id, task_date desc);
create index daily_tasks_work_item_idx on public.daily_tasks(work_item_id);
create index daily_tasks_status_idx on public.daily_tasks(status);

create or replace function public.touch_daily_task()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end;
$$;

create trigger daily_tasks_before_write
before insert or update on public.daily_tasks
for each row execute procedure public.touch_daily_task();

alter table public.daily_tasks enable row level security;
create policy "authenticated read daily tasks" on public.daily_tasks for select to authenticated using (true);
create policy "editors insert daily tasks" on public.daily_tasks for insert to authenticated with check (public.current_app_role() in ('admin', 'editor'));
create policy "editors update daily tasks" on public.daily_tasks for update to authenticated using (public.current_app_role() in ('admin', 'editor')) with check (public.current_app_role() in ('admin', 'editor'));
create policy "editors delete daily tasks" on public.daily_tasks for delete to authenticated using (public.current_app_role() in ('admin', 'editor'));
