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
  const preferred = members.filter((m) => ["wladimick", "braulio"].includes(m.short_name.toLowerCase()));
  const tabs = preferred.length ? preferred : members.slice(0, 2);
  const [activeId, setActiveId] = useState(tabs[0]?.id ?? "");
  const [editing, setEditing] = useState<DailyTask | "new" | null>(null);
  const [batchOpen, setBatchOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const active = tabs.find((m) => m.id === activeId) ?? tabs[0];
  const visibleTasks = tasks.filter((task) => task.team_member_id === active?.id);
  if (!active) return <p>No hay integrantes activos en Diseño.</p>;
  const totalToday = visibleTasks.filter((t) => t.task_date === new Date().toISOString().slice(0,10)).reduce((s,t) => s+t.hours,0);

  const actions = canEdit(role) ? <>
    <button className="tbx-button-secondary" type="button" onClick={() => setAssistantOpen(true)}><Bot size={17}/> Asistente IA</button>
    <button className="tbx-button-secondary" type="button" onClick={() => setBatchOpen(true)}><ListPlus size={17}/> Carga rápida</button>
    <button className="tbx-button-primary" type="button" onClick={() => setEditing("new")}><Plus size={17}/> Agregar tarea</button>
  </> : undefined;

  return <>
    <PageHeader eyebrow="Bitácora operativa" title="Tareas diarias" description="Registra lo realizado por persona, las HH reales y su asociación con proyectos o requerimientos principales." actions={actions} />
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--tbx-border)]">
      <div className="flex gap-1">{tabs.map((m) => <button key={m.id} className={`tbx-person-tab ${active.id === m.id ? "is-active" : ""}`} onClick={() => setActiveId(m.id)}>{m.short_name}</button>)}</div>
      <p className="pb-3 text-sm"><strong className="text-[var(--tbx-text)]">{totalToday.toLocaleString("es-CL")} HH</strong> registradas hoy</p>
    </div>
    <DailyTasksTable tasks={visibleTasks} role={role} member={active} onEdit={setEditing} />
    {editing ? <DailyTaskModal key={editing === "new" ? `new-${active.id}` : editing.id} task={editing === "new" ? undefined : editing} member={active} members={tabs} workItems={workItems} role={role} onClose={() => setEditing(null)} /> : null}
    {batchOpen ? <DailyTasksBatchModal key={`batch-${active.id}`} member={active} workItems={workItems} onClose={() => setBatchOpen(false)} /> : null}
    {assistantOpen ? <DailyTasksAiAssistantModal key={`assistant-${active.id}`} member={active} workItems={workItems} onClose={() => setAssistantOpen(false)} onOpenBatch={() => setBatchOpen(true)} /> : null}
  </>;
}
