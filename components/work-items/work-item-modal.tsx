"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { quickSaveWorkItemAction } from "@/app/(app)/trabajo/actions";
import { SIZE_LABELS, SOURCE_LABELS, STATUS_LABELS, TYPE_LABELS } from "@/lib/constants";
import type { AppRole, TeamMember, WorkItem } from "@/lib/types";
import { canEdit, formatHours } from "@/lib/utils";

function dateWeeks(start: string, end: string) {
  if (!start || !end) return 1;
  const days = Math.floor((new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime()) / 86400000) + 1;
  return Math.max(1, Math.ceil(days / 7));
}

export function WorkItemModal({
  item,
  teamMembers,
  role,
  onClose,
}: {
  item?: WorkItem;
  teamMembers: TeamMember[];
  role: AppRole;
  onClose: () => void;
}) {
  const router = useRouter();
  const editable = canEdit(role);
  const [state, action, pending] = useActionState(quickSaveWorkItemAction, {});
  const [startDate, setStartDate] = useState(item?.start_date ?? "");
  const [endDate, setEndDate] = useState(item?.end_date ?? "");
  const [duration, setDuration] = useState(item?.duration_weeks ?? 1);
  const [hhTotal, setHhTotal] = useState(item?.hh_total ?? 0);
  const weekly = useMemo(() => (duration > 0 ? hhTotal / duration : hhTotal), [duration, hhTotal]);
  const assignmentMap = new Map(item?.assignments.map((assignment) => [assignment.team_member.id, Math.round(assignment.percentage * 100)]) ?? []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, pending]);

  useEffect(() => {
    if (!state.ok) return;
    router.refresh();
    onClose();
  }, [state.ok, router, onClose]);

  function recalcDates(nextStart: string, nextEnd: string) {
    if (nextStart && nextEnd) setDuration(dateWeeks(nextStart, nextEnd));
  }

  return (
    <div className="tbx-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onClose(); }}>
      <section className="tbx-modal tbx-modal-wide" role="dialog" aria-modal="true" aria-labelledby="work-item-modal-title">
        <header className="tbx-modal-header">
          <div className="min-w-0">
            <span className="tbx-mono text-[.68rem] uppercase tracking-[.16em] text-[var(--tbx-support)]">{item?.code ?? "Nuevo registro"}</span>
            <h2 id="work-item-modal-title" className="mt-1 truncate text-2xl font-bold text-[var(--tbx-text)]">{item ? "Detalle y edición rápida" : "Agregar trabajo"}</h2>
            <p className="mt-1 text-sm">{item ? `${item.client_name} · ${item.title}` : "Registra lo esencial ahora y completa el resto después."}</p>
          </div>
          <button className="tbx-icon-button" type="button" onClick={onClose} aria-label="Cerrar" disabled={pending}><X size={19} /></button>
        </header>

        <form action={action} className="flex min-h-0 flex-1 flex-col">
          <input type="hidden" name="id" value={item?.id ?? ""} />
          <input type="hidden" name="code" value={item?.code ?? ""} />
          <input type="hidden" name="description" value={item?.description ?? ""} />
          <input type="hidden" name="source_url" value={item?.source_url ?? ""} />
          <input type="hidden" name="area" value={item?.area ?? "Diseño"} />
          <input type="hidden" name="category" value={item?.category ?? "external"} />
          <input type="hidden" name="duration_weeks" value={duration} />

          <div className="tbx-modal-body space-y-5">
            <div className="grid gap-3 md:grid-cols-[.9fr_1.6fr]">
              <div><label className="tbx-label" htmlFor="quick_client_name">Cliente</label><input className="tbx-input" id="quick_client_name" name="client_name" defaultValue={item?.client_name ?? ""} required disabled={!editable} autoFocus={!item} /></div>
              <div><label className="tbx-label" htmlFor="quick_title">Trabajo</label><input className="tbx-input" id="quick_title" name="title" defaultValue={item?.title ?? ""} required disabled={!editable} /></div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div><label className="tbx-label" htmlFor="quick_type">Tipo</label><select className="tbx-input" id="quick_type" name="type" defaultValue={item?.type ?? "task"} disabled={!editable}>{Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <div><label className="tbx-label" htmlFor="quick_size">Tamaño</label><select className="tbx-input" id="quick_size" name="size" defaultValue={item?.size ?? "pending"} disabled={!editable}>{Object.entries(SIZE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <div><label className="tbx-label" htmlFor="quick_status">Estado</label><select className="tbx-input" id="quick_status" name="status" defaultValue={item?.status ?? "inbox"} disabled={!editable}>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
              <div><label className="tbx-label" htmlFor="quick_source">Origen</label><select className="tbx-input" id="quick_source" name="source" defaultValue={item?.source ?? "manual"} disabled={!editable}>{Object.entries(SOURCE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div><label className="tbx-label" htmlFor="quick_source_reference">Ticket / ID</label><input className="tbx-input" id="quick_source_reference" name="source_reference" defaultValue={item?.source_reference ?? ""} placeholder="Ej. 116973" disabled={!editable} /></div>
              <div><label className="tbx-label" htmlFor="quick_start_date">Inicio</label><input className="tbx-input" id="quick_start_date" name="start_date" type="date" value={startDate} disabled={!editable} onChange={(event) => { setStartDate(event.target.value); recalcDates(event.target.value, endDate); }} /></div>
              <div><label className="tbx-label" htmlFor="quick_end_date">Término</label><input className="tbx-input" id="quick_end_date" name="end_date" type="date" value={endDate} disabled={!editable} onChange={(event) => { setEndDate(event.target.value); recalcDates(startDate, event.target.value); }} /></div>
              <div><label className="tbx-label" htmlFor="quick_hh_total">HH totales Diseño</label><input className="tbx-input" id="quick_hh_total" name="hh_total" type="number" min="0" step="0.25" value={hhTotal} disabled={!editable} onChange={(event) => setHhTotal(Number(event.target.value))} /></div>
            </div>

            <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
              <div className="tbx-panel flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--tbx-surface)] text-[var(--tbx-support)]"><CalendarDays size={18} /></span><div><p className="text-xs uppercase tracking-[.08em] text-[var(--tbx-text-subtle)]">Planificación calculada</p><p className="font-semibold text-[var(--tbx-text)]">{formatHours(duration)} sem. · {formatHours(weekly)} HH/sem.</p></div></div>
              </div>
              <label className="flex min-w-52 cursor-pointer items-center gap-3 rounded-xl border border-[var(--tbx-border)] bg-[var(--tbx-surface)] px-4 py-3">
                <input type="checkbox" name="report_to_cesar" defaultChecked={item?.report_to_cesar ?? false} disabled={!editable} />
                <span><strong className="block text-sm text-[var(--tbx-text)]">Reportar a César</strong><span className="text-xs">Incluir en el consolidado</span></span>
              </label>
            </div>

            <div>
              <div className="mb-2 flex items-end justify-between"><div><label className="tbx-label mb-0">Asignación del equipo</label><p className="text-xs">Los valores mayores a cero deben sumar 100 %.</p></div></div>
              <div className="grid gap-2 sm:grid-cols-2">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 rounded-xl border border-[var(--tbx-border)] bg-[var(--tbx-surface)] p-3">
                    <input type="hidden" name="assignment_member_id" value={member.id} />
                    <div className="min-w-0 flex-1"><p className="truncate font-semibold text-[var(--tbx-text)]">{member.full_name}</p><p className="text-xs">{member.role_title || member.area}</p></div>
                    <div className="relative w-24"><input className="tbx-input pr-7 text-right" name={`assignment_${member.id}`} type="number" min="0" max="100" step="1" defaultValue={assignmentMap.get(member.id) ?? 0} disabled={!editable} /><span className="pointer-events-none absolute right-3 top-2.5 text-sm text-[var(--tbx-text-subtle)]">%</span></div>
                  </div>
                ))}
              </div>
            </div>

            <div><label className="tbx-label" htmlFor="quick_comments">Comentarios para el Excel</label><textarea className="tbx-input min-h-20" id="quick_comments" name="comments" defaultValue={item?.comments ?? ""} disabled={!editable} /></div>

            {state.error ? <p className="rounded-xl border border-[color:var(--tbx-danger)]/30 bg-[color:var(--tbx-danger)]/5 p-3 text-sm text-[var(--tbx-danger)]">{state.error}</p> : null}
          </div>

          <footer className="tbx-modal-footer">
            <button className="tbx-button-ghost" type="button" onClick={onClose} disabled={pending}>Cancelar</button>
            {item && editable ? <Link className="tbx-button-secondary" href={`/trabajo/${item.id}/editar`}><ArrowUpRight size={16} /> Editar todo</Link> : null}
            {!item && editable ? <Link className="tbx-button-secondary" href="/trabajo/nuevo"><ArrowUpRight size={16} /> Formulario completo</Link> : null}
            {editable ? <button className="tbx-button-primary min-w-36" type="submit" disabled={pending}><Save size={17} />{pending ? "Guardando…" : item ? "Guardar cambios" : "Crear registro"}</button> : <button className="tbx-button-secondary" type="button" onClick={onClose}>Cerrar</button>}
          </footer>
        </form>
      </section>
    </div>
  );
}
