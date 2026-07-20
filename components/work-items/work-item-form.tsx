"use client";

import { useActionState, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { saveWorkItemAction } from "@/app/(app)/trabajo/actions";
import { AREA_OPTIONS, CATEGORY_LABELS, SIZE_LABELS, SOURCE_LABELS, STATUS_LABELS, TYPE_LABELS } from "@/lib/constants";
import type { TeamMember, WorkItem } from "@/lib/types";

function dateWeeks(start: string, end: string) {
  if (!start || !end) return 1;
  const days = Math.floor((new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime()) / 86400000) + 1;
  return Math.max(1, Math.ceil(days / 7));
}

export function WorkItemForm({ item, teamMembers }: { item?: WorkItem; teamMembers: TeamMember[] }) {
  const [state, action, pending] = useActionState(saveWorkItemAction, {});
  const [startDate, setStartDate] = useState(item?.start_date ?? "");
  const [endDate, setEndDate] = useState(item?.end_date ?? "");
  const [duration, setDuration] = useState(item?.duration_weeks ?? 1);
  const [hhTotal, setHhTotal] = useState(item?.hh_total ?? 0);

  const weekly = useMemo(() => (duration > 0 ? hhTotal / duration : hhTotal), [duration, hhTotal]);
  const assignmentMap = new Map(item?.assignments.map((a) => [a.team_member.id, Math.round(a.percentage * 100)]) ?? []);

  function recalcDates(nextStart: string, nextEnd: string) {
    if (nextStart && nextEnd) setDuration(dateWeeks(nextStart, nextEnd));
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <section className="tbx-card p-5 sm:p-6">
        <h2 className="text-xl font-bold text-[var(--tbx-text)]">Identificación</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div><label className="tbx-label" htmlFor="client_name">Cliente</label><input className="tbx-input" id="client_name" name="client_name" defaultValue={item?.client_name} required /></div>
          <div className="md:col-span-2"><label className="tbx-label" htmlFor="title">Título</label><input className="tbx-input" id="title" name="title" defaultValue={item?.title} required /></div>
          <div><label className="tbx-label" htmlFor="code">Código</label><input className="tbx-input" id="code" name="code" defaultValue={item?.code} placeholder="Se genera automáticamente" /><p className="tbx-help">Déjalo vacío en un registro nuevo.</p></div>
          <div><label className="tbx-label" htmlFor="type">Tipo</label><select className="tbx-input" id="type" name="type" defaultValue={item?.type ?? "task"}>{Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div><label className="tbx-label" htmlFor="size">Tamaño</label><select className="tbx-input" id="size" name="size" defaultValue={item?.size ?? "pending"}>{Object.entries(SIZE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div><label className="tbx-label" htmlFor="status">Estado</label><select className="tbx-input" id="status" name="status" defaultValue={item?.status ?? "inbox"}>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div><label className="tbx-label" htmlFor="area">Área principal</label><select className="tbx-input" id="area" name="area" defaultValue={item?.area ?? "Diseño"}>{AREA_OPTIONS.map((area) => <option key={area}>{area}</option>)}</select></div>
          <div><label className="tbx-label" htmlFor="category">Categoría</label><select className="tbx-input" id="category" name="category" defaultValue={item?.category ?? "external"}>{Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div className="md:col-span-2 xl:col-span-3"><label className="tbx-label" htmlFor="description">Descripción interna</label><textarea className="tbx-input min-h-24" id="description" name="description" defaultValue={item?.description ?? ""} /></div>
        </div>
      </section>

      <section className="tbx-card p-5 sm:p-6">
        <h2 className="text-xl font-bold text-[var(--tbx-text)]">Origen y referencia</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div><label className="tbx-label" htmlFor="source">Origen</label><select className="tbx-input" id="source" name="source" defaultValue={item?.source ?? "manual"}>{Object.entries(SOURCE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div><label className="tbx-label" htmlFor="source_reference">Ticket / ID externo</label><input className="tbx-input" id="source_reference" name="source_reference" defaultValue={item?.source_reference ?? ""} placeholder="Ej. 116973" /></div>
          <div><label className="tbx-label" htmlFor="source_url">Enlace</label><input className="tbx-input" id="source_url" name="source_url" type="url" defaultValue={item?.source_url ?? ""} placeholder="https://…" /></div>
        </div>
      </section>

      <section className="tbx-card p-5 sm:p-6">
        <h2 className="text-xl font-bold text-[var(--tbx-text)]">Planificación y HH de Diseño</h2>
        <p className="mt-1 text-sm">Registra solamente las horas correspondientes a tu área, aunque la propuesta completa incluya Infraestructura u otras áreas.</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div><label className="tbx-label" htmlFor="start_date">Fecha inicio</label><input className="tbx-input" id="start_date" name="start_date" type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); recalcDates(e.target.value, endDate); }} /></div>
          <div><label className="tbx-label" htmlFor="end_date">Fecha término</label><input className="tbx-input" id="end_date" name="end_date" type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); recalcDates(startDate, e.target.value); }} /></div>
          <div><label className="tbx-label" htmlFor="duration_weeks">Duración (sem.)</label><input className="tbx-input" id="duration_weeks" name="duration_weeks" type="number" min="1" step="1" value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></div>
          <div><label className="tbx-label" htmlFor="hh_total">HH totales</label><input className="tbx-input" id="hh_total" name="hh_total" type="number" min="0" step="0.25" value={hhTotal} onChange={(e) => setHhTotal(Number(e.target.value))} /></div>
        </div>
        <div className="tbx-panel mt-4 flex flex-wrap items-center justify-between gap-3 p-4">
          <span className="text-sm">Promedio semanal calculado</span>
          <strong className="tbx-mono text-lg text-[var(--tbx-text)]">{weekly.toLocaleString("es-CL", { maximumFractionDigits: 3 })} HH/sem.</strong>
        </div>
      </section>

      <section className="tbx-card p-5 sm:p-6">
        <h2 className="text-xl font-bold text-[var(--tbx-text)]">Asignación</h2>
        <p className="mt-1 text-sm">Los porcentajes con valor mayor a cero deben sumar 100 %.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center gap-3 rounded-xl border border-[var(--tbx-border)] p-3">
              <input type="hidden" name="assignment_member_id" value={member.id} />
              <div className="min-w-0 flex-1"><p className="font-semibold text-[var(--tbx-text)]">{member.full_name}</p><p className="text-xs">{member.role_title || member.area}</p></div>
              <div className="relative w-24"><input className="tbx-input pr-7 text-right" name={`assignment_${member.id}`} type="number" min="0" max="100" step="1" defaultValue={assignmentMap.get(member.id) ?? 0} /><span className="absolute right-3 top-2.5 text-sm text-[var(--tbx-text-subtle)]">%</span></div>
            </div>
          ))}
        </div>
      </section>

      <section className="tbx-card p-5 sm:p-6">
        <h2 className="text-xl font-bold text-[var(--tbx-text)]">Reporte de César</h2>
        <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--tbx-border)] p-4">
          <input className="mt-1 h-4 w-4" type="checkbox" name="report_to_cesar" defaultChecked={item?.report_to_cesar ?? false} />
          <span><strong className="block text-[var(--tbx-text)]">Incluir en el reporte</strong><span className="text-sm">Las tareas nuevas quedan fuera hasta que tú decidas consolidarlas.</span></span>
        </label>
        <div className="mt-4"><label className="tbx-label" htmlFor="comments">Comentarios para el Excel</label><textarea className="tbx-input min-h-24" id="comments" name="comments" defaultValue={item?.comments ?? ""} /></div>
      </section>

      {state.error ? <p className="rounded-xl border border-[color:var(--tbx-danger)]/30 bg-[color:var(--tbx-danger)]/5 p-4 text-[var(--tbx-danger)]">{state.error}</p> : null}
      <div className="flex justify-end pb-20 lg:pb-0"><button className="tbx-button-primary min-w-40" disabled={pending} type="submit"><Save size={17} />{pending ? "Guardando…" : "Guardar"}</button></div>
    </form>
  );
}
