"use client";

import { useState } from "react";
import { Bot, ListPlus, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DailyTaskModal } from "@/components/daily-tasks/daily-task-modal";
import { DailyTasksAiAssistantModal } from "@/components/daily-tasks/daily-tasks-ai-assistant-modal";
import { DailyTasksBatchModal } from "@/components/daily-tasks/daily-tasks-batch-modal";
import { DailyTasksTable } from "@/components/daily-tasks/daily-tasks-table";
import type { AppRole, DailyTask, TeamMember, WorkItem } from "@/lib/types";
import { canEdit } from "@/lib/utils";

export function DailyTasksWorkspace({ tasks, members, workItems, role }: { tasks: DailyTask[]; members: TeamMember[]; workItems: WorkItem[]; role: AppRole }) {
  const preferred = members.filter((member) => ["wladimick", "braulio"].includes(member.short_name.toLowerCase()));
  const tabs = preferred.length ? preferred : members.slice(0, 2);
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? "");
  const [editing, setEditing] = useState<DailyTask | "new" | null>(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const active = tabs.find((member) => member.id === activeId) ?? tabs[0];
  const visibleTasks = tasks.filter((task) => task.team_member_id === active?.id);
  if (!active) return <p>No hay integrantes activos en Diseño.</p>;
  const totalToday = visibleTasks.filter((task) => task.task_date === new Date().toISOString().slice(0, 10)).reduce((sum, task) => sum + task.hours, 0);

  const actions = canEdit(role) ? <>
    <button className="tbx-button-secondary" type="button" onClick={() => setAssistantOpen(true)}><Bot size={17}/> Asistente IA</button>
    <button className="tbx-button-secondary" type="button" onClick={() => setBatchOpen(true)}><ListPlus size={17}/> Carga rápida</button>
    <button className="tbx-button-primary" type="button" onClick={() => setEditing("new")}><Plus size={17}/> Agregar tarea</button>
  </> : undefined;

  return <>
    <PageHeader eyebrow="Bitácora operativa" title="Tareas diarias" description="Registra lo realizado por persona, las HH reales y su asociación con proyectos o requerimientos principales." actions={actions} />
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--tbx-border)]">
      <div className="flex gap-1">{tabs.map((member) => <button key={member.id} className={`tbx-person-tab ${active.id === member.id ? "is-active" : ""}`} onClick={() => setActiveId(member.id)}>{member.short_name}</button>)}</div>
      <p className="pb-3 text-sm"><strong className="text-[var(--tbx-text)]">{totalToday.toLocaleString("es-CL")} HH</strong> registradas hoy</p>
    </div>

    {canEdit(role) ? <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[var(--tbx-border-accent)] bg-[color:var(--tbx-support)]/[.04] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--tbx-surface-2)] text-[var(--tbx-support)]"><Bot size={20}/></span><div><p className="font-semibold text-[var(--tbx-text)]">¿Terminaste el día o la semana?</p><p className="text-sm">Copia un prompt guiado para ChatGPT, Claude o Gemini y recibe el texto listo para Carga rápida.</p></div></div><button className="tbx-button-secondary shrink-0" type="button" onClick={() => setAssistantOpen(true)}><Bot size={17}/> Copiar prompt con IA</button></div> : null}

    <DailyTasksTable tasks={visibleTasks} role={role} member={active} onEdit={setEditing} />
    {editing ? <DailyTaskModal key={editing === "new" ? `new-${active.id}` : editing.id} task={editing === "new" ? undefined : editing} member={active} members={tabs} workItems={workItems} role={role} onClose={() => setEditing(null)} /> : null}
    {batchOpen ? <DailyTasksBatchModal key={`batch-${active.id}`} member={active} workItems={workItems} onClose={() => setBatchOpen(false)} /> : null}
    {assistantOpen ? <DailyTasksAiAssistantModal key={`assistant-${active.id}`} member={active} workItems={workItems} onClose={() => setAssistantOpen(false)} onOpenBatch={() => { setAssistantOpen(false); setBatchOpen(true); }} /> : null}
  </>;
}
