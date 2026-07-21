"use client";

import { useActionState, useEffect, useState } from "react";
import { Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveDailyTaskAction } from "@/app/(app)/tareas-diarias/actions";
import { WorkItemCombobox } from "@/components/daily-tasks/work-item-combobox";
import { DAILY_STATUS_LABELS, SOURCE_LABELS } from "@/lib/constants";
import type { AppRole, DailyTask, TeamMember, WorkItem } from "@/lib/types";
import { canEdit } from "@/lib/utils";

export function DailyTaskModal({ task, member, members, workItems, role, onClose }: {
  task?: DailyTask;
  member: TeamMember;
  members: TeamMember[];
  workItems: WorkItem[];
  role: AppRole;
  onClose: () => void;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveDailyTaskAction, {});
  const editable = canEdit(role);
  const [workItemId, setWorkItemId] = useState<string | null>(task?.work_item_id ?? null);
  useEffect(() => {
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (event: KeyboardEvent) => { if (event.key === "Escape" && !pending) onClose(); };
    window.addEventListener("keydown", key);
    return () => { document.body.style.overflow = old; window.removeEventListener("keydown", key); };
  }, [onClose, pending]);
  useEffect(() => { if (state.ok) { router.refresh(); onClose(); } }, [state.ok, router, onClose]);
  return (
    <div className="tbx-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget && !pending) onClose(); }}>
      <section className="tbx-modal max-w-3xl" role="dialog" aria-modal="true">
        <header className="tbx-modal-header"><div><span className="tbx-mono text-[.68rem] uppercase tracking-[.16em] text-[var(--tbx-support)]">Registro diario</span><h2 className="mt-1 text-2xl font-bold text-[var(--tbx-text)]">{task ? "Editar tarea" : `Nueva tarea · ${member.short_name}`}</h2></div><button className="tbx-icon-button" type="button" onClick={onClose}><X size={19} /></button></header>
        <form action={action} className="flex min-h-0 flex-1 flex-col">
          <input type="hidden" name="id" value={task?.id ?? ""} />
          <div className="tbx-modal-body space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div><label className="tbx-label">Persona</label><select className="tbx-input" name="team_member_id" defaultValue={task?.team_member_id ?? member.id} disabled={!editable}>{members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}</select></div>
              <div><label className="tbx-label">Fecha</label><input className="tbx-input" name="task_date" type="date" defaultValue={task?.task_date ?? new Date().toISOString().slice(0,10)} required disabled={!editable} /></div>
              <div><label className="tbx-label">HH invertidas</label><input className="tbx-input" name="hours" type="number" min="0.25" max="24" step="0.25" defaultValue={task?.hours ?? 1} required disabled={!editable} /></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-[.8fr_1.4fr]"><div><label className="tbx-label">Cliente</label><input className="tbx-input" name="client_name" defaultValue={task?.client_name ?? ""} required disabled={!editable} /></div><div><label className="tbx-label">Descripción</label><input className="tbx-input" name="description" defaultValue={task?.description ?? ""} required disabled={!editable} /></div></div>
            <div><label className="tbx-label">Asociar a trabajo principal</label><input type="hidden" name="work_item_id" value={workItemId ?? ""} /><WorkItemCombobox items={workItems} value={workItemId} onChange={setWorkItemId} disabled={!editable} placeholder="Buscar por cliente, código o trabajo..." /><p className="tbx-help">Las horas se contabilizan como ejecutadas sin modificar las HH estimadas del trabajo principal.</p></div>
            <div className="grid gap-3 sm:grid-cols-3"><div><label className="tbx-label">Estado</label><select className="tbx-input" name="status" defaultValue={task?.status ?? "done"} disabled={!editable}>{Object.entries(DAILY_STATUS_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div><div><label className="tbx-label">Origen</label><select className="tbx-input" name="source" defaultValue={task?.source ?? "manual"} disabled={!editable}>{Object.entries(SOURCE_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></div><div><label className="tbx-label">Ticket / ID</label><input className="tbx-input" name="source_reference" defaultValue={task?.source_reference ?? ""} disabled={!editable} /></div></div>
            <div><label className="tbx-label">Enlace</label><input className="tbx-input" name="source_url" type="url" defaultValue={task?.source_url ?? ""} placeholder="https://..." disabled={!editable} /></div>
            <div><label className="tbx-label">Comentarios</label><textarea className="tbx-input min-h-20" name="comments" defaultValue={task?.comments ?? ""} disabled={!editable} /></div>
            {state.error ? <p className="rounded-xl border border-[color:var(--tbx-danger)]/30 bg-[color:var(--tbx-danger)]/5 p-3 text-sm text-[var(--tbx-danger)]">{state.error}</p> : null}
          </div>
          <footer className="tbx-modal-footer"><button className="tbx-button-ghost" type="button" onClick={onClose}>Cancelar</button>{editable ? <button className="tbx-button-primary" type="submit" disabled={pending}><Save size={17}/>{pending ? "Guardando…" : "Guardar tarea"}</button> : null}</footer>
        </form>
      </section>
    </div>
  );
}
