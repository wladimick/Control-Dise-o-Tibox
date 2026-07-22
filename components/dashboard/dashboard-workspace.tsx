"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Bot, CalendarDays, Clock3, FileCheck2, Inbox, ListChecks, ListPlus, Plus, Users } from "lucide-react";
import { DailyTaskModal } from "@/components/daily-tasks/daily-task-modal";
import { DailyTasksAiAssistantModal } from "@/components/daily-tasks/daily-tasks-ai-assistant-modal";
import { DailyTasksBatchModal } from "@/components/daily-tasks/daily-tasks-batch-modal";
import { Badge } from "@/components/ui/badge";
import { SIZE_LABELS, STATUS_LABELS, TYPE_LABELS } from "@/lib/constants";
import type { AppRole, DailyTask, Profile, TeamMember, WorkItem } from "@/lib/types";
import { canEdit, formatDateTime, formatHours } from "@/lib/utils";

type ModalState = "new" | "batch" | "assistant" | null;

const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthCells(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - startOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export function DashboardWorkspace({
  profile,
  items,
  tasks,
  members,
  role,
}: {
  profile: Profile;
  items: WorkItem[];
  tasks: DailyTask[];
  members: TeamMember[];
  role: AppRole;
}) {
  const activeItems = items.filter((item) => ["inbox", "planned", "in_progress", "blocked"].includes(item.status));
  const pending = activeItems.filter((item) => item.size === "pending");
  const reportable = activeItems.filter((item) => item.report_to_cesar);
  const totalHours = activeItems.reduce((sum, item) => sum + item.hh_total, 0);
  const people = new Set(activeItems.flatMap((item) => item.assignments.map((assignment) => assignment.team_member.short_name))).size;
  const preferred = members.filter((member) => ["wladimick", "braulio"].includes(member.short_name.toLowerCase()));
  const tabs = preferred.length ? preferred : members.slice(0, 2);
  const [activeMemberId, setActiveMemberId] = useState(tabs[0]?.id ?? "");
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [modal, setModal] = useState<ModalState>(null);
  const activeMember = tabs.find((member) => member.id === activeMemberId) ?? tabs[0];
  const memberTasks = tasks.filter((task) => task.team_member_id === activeMember?.id);
  const cells = useMemo(() => monthCells(month), [month]);
  const today = localDateKey(new Date());
  const monthLabel = month.toLocaleDateString("es-CL", { month: "long", year: "numeric" });

  const cards = [
    { label: "Trabajo activo", value: activeItems.length, icon: ListChecks },
    { label: "Por clasificar", value: pending.length, icon: Inbox },
    { label: "Reporte César", value: reportable.length, icon: FileCheck2 },
    { label: "HH estimadas activas", value: formatHours(totalHours), icon: Clock3 },
    { label: "Personas asignadas", value: people, icon: Users },
  ];

  return (
    <>
      <div className="mb-7 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <span className="tbx-mono text-[.7rem] uppercase tracking-[.16em] text-[var(--tbx-support)]">Resumen operativo</span>
          <h1 className="mt-2 text-4xl font-bold text-[var(--tbx-text)]">Hola, {profile.full_name?.split(" ")[0] || "equipo"}</h1>
          <p className="mt-1">Registra el trabajo diario y mantén controladas las tareas principales.</p>
        </div>
        {canEdit(role) && activeMember ? (
          <div className="flex flex-wrap gap-2">
            <button className="tbx-button-secondary" type="button" onClick={() => setModal("assistant")}><Bot size={17} /> Asistente IA</button>
            <button className="tbx-button-secondary" type="button" onClick={() => setModal("batch")}><ListPlus size={17} /> Carga rápida</button>
            <button className="tbx-button-primary" type="button" onClick={() => setModal("new")}><Plus size={17} /> Agregar tarea</button>
          </div>
        ) : null}
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, value, icon: Icon }) => (
          <article key={label} className="tbx-card p-5">
            <Icon size={19} className="text-[var(--tbx-support)]" />
            <p className="mt-5 text-3xl font-bold text-[var(--tbx-text)]">{value}</p>
            <p className="mt-1 text-sm">{label}</p>
          </article>
        ))}
      </section>

      <section className="mt-7 grid gap-6 2xl:grid-cols-[1.45fr_.55fr]">
        <div className="tbx-card overflow-hidden">
          <header className="flex flex-col gap-4 border-b border-[var(--tbx-border)] p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--tbx-surface-2)] text-[var(--tbx-support)]"><CalendarDays size={20} /></span>
              <div><h2 className="text-xl font-bold capitalize text-[var(--tbx-text)]">{monthLabel}</h2><p className="text-sm">HH reales registradas por día.</p></div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl border border-[var(--tbx-border)] p-1">
                {tabs.map((member) => <button key={member.id} className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${activeMember?.id === member.id ? "bg-[var(--tbx-surface-2)] text-[var(--tbx-text)]" : ""}`} type="button" onClick={() => setActiveMemberId(member.id)}>{member.short_name}</button>)}
              </div>
              <button className="tbx-icon-button" type="button" aria-label="Mes anterior" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ArrowLeft size={18} /></button>
              <button className="tbx-button-secondary" type="button" onClick={() => setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>Hoy</button>
              <button className="tbx-icon-button" type="button" aria-label="Mes siguiente" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ArrowRight size={18} /></button>
            </div>
          </header>

          <div className="grid grid-cols-7 border-b border-[var(--tbx-border)] bg-[var(--tbx-surface-2)]">
            {weekDays.map((day) => <div key={day} className="px-2 py-3 text-center tbx-mono text-[.68rem] uppercase tracking-[.08em] text-[var(--tbx-text-subtle)]">{day}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((date) => {
              const key = localDateKey(date);
              const dayTasks = memberTasks.filter((task) => task.task_date === key);
              const hours = dayTasks.reduce((sum, task) => sum + task.hours, 0);
              const inMonth = date.getMonth() === month.getMonth();
              return (
                <button
                  key={key}
                  type="button"
                  className={`min-h-28 border-b border-r border-[var(--tbx-border)] p-2 text-left transition hover:bg-[var(--tbx-surface-2)] ${!inMonth ? "opacity-35" : ""} ${key === today ? "bg-[color:var(--tbx-support)]/[.05]" : ""}`}
                  onClick={() => { if (canEdit(role) && key === today) setModal("new"); }}
                  title={key === today ? "Agregar una tarea para hoy" : undefined}
                >
                  <div className="flex items-center justify-between"><span className={`grid h-7 w-7 place-items-center rounded-full text-sm font-semibold ${key === today ? "bg-[var(--tbx-support)] text-white" : "text-[var(--tbx-text)]"}`}>{date.getDate()}</span>{hours > 0 ? <strong className="tbx-mono text-xs text-[var(--tbx-support)]">{formatHours(hours)} HH</strong> : null}</div>
                  <div className="mt-2 space-y-1">
                    {dayTasks.slice(0, 3).map((task) => <div key={task.id} className="truncate rounded-md bg-[var(--tbx-surface-2)] px-2 py-1 text-xs text-[var(--tbx-text)]">{task.client_name} · {task.description}</div>)}
                    {dayTasks.length > 3 ? <p className="px-1 text-xs">+{dayTasks.length - 3} más</p> : null}
                  </div>
                </button>
              );
            })}
          </div>
          <footer className="flex items-center justify-between gap-3 p-4 text-sm"><span>Haz clic en el día de hoy para registrar una tarea.</span><Link href="/tareas-diarias" className="tbx-button-ghost">Ver bitácora completa <ArrowRight size={16} /></Link></footer>
        </div>

        <div className="space-y-6">
          <div className="tbx-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--tbx-border)] p-5"><div><h2 className="text-xl font-bold text-[var(--tbx-text)]">Trabajo reciente</h2><p className="text-sm">Últimos registros modificados.</p></div><Link href="/trabajo" className="tbx-button-ghost">Ver todo <ArrowRight size={16} /></Link></div>
            <div className="divide-y divide-[var(--tbx-border)]">
              {items.slice(0, 6).map((item) => <Link href={`/trabajo/${item.id}/editar`} key={item.id} className="block p-4 hover:bg-[var(--tbx-surface-2)]"><p className="line-clamp-2 font-semibold text-[var(--tbx-text)]">{item.client_name} · {item.title}</p><div className="mt-2 flex flex-wrap items-center gap-2"><Badge tone="blue">{TYPE_LABELS[item.type]}</Badge><Badge>{STATUS_LABELS[item.status]}</Badge><span className="ml-auto tbx-mono text-[.64rem]">{formatDateTime(item.updated_at)}</span></div></Link>)}
            </div>
          </div>
          <div className="tbx-card p-5"><h2 className="text-xl font-bold text-[var(--tbx-text)]">Pendientes de decisión</h2><p className="mt-1 text-sm">Elementos aún sin clasificar.</p><div className="mt-4 space-y-2">{pending.slice(0, 4).map((item) => <Link key={item.id} href={`/trabajo/${item.id}/editar`} className="block rounded-xl border border-[var(--tbx-border)] p-3 hover:border-[var(--tbx-border-accent)]"><p className="font-semibold text-[var(--tbx-text)]">{item.title}</p><p className="text-sm">{item.client_name} · {formatHours(item.hh_total)} HH</p><div className="mt-2"><Badge tone="amber">{SIZE_LABELS[item.size]}</Badge></div></Link>)}{!pending.length ? <p className="rounded-xl bg-[var(--tbx-surface-2)] p-4 text-sm">No hay tareas pendientes de clasificación.</p> : null}</div></div>
        </div>
      </section>

      {modal === "new" && activeMember ? <DailyTaskModal key={`dashboard-new-${activeMember.id}`} member={activeMember} members={tabs} workItems={items} role={role} onClose={() => setModal(null)} /> : null}
      {modal === "batch" && activeMember ? <DailyTasksBatchModal key={`dashboard-batch-${activeMember.id}`} member={activeMember} workItems={items} onClose={() => setModal(null)} /> : null}
      {modal === "assistant" && activeMember ? <DailyTasksAiAssistantModal key={`dashboard-assistant-${activeMember.id}`} member={activeMember} workItems={items} onClose={() => setModal(null)} onOpenBatch={() => setModal("batch")} /> : null}
    </>
  );
}
