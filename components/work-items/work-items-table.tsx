"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Columns3, ExternalLink, Pencil, Search, Settings2, Trash2, TrendingUp } from "lucide-react";
import { deleteWorkItemAction, promoteWorkItemAction } from "@/app/(app)/trabajo/actions";
import { Badge } from "@/components/ui/badge";
import { SIZE_LABELS, SOURCE_LABELS, STATUS_LABELS, TYPE_LABELS } from "@/lib/constants";
import type { AppRole, WorkItem } from "@/lib/types";
import { canEdit, formatDate, formatDateTime, formatHours } from "@/lib/utils";

type ColumnKey =
  | "code" | "client" | "title" | "type" | "size" | "status" | "source" | "dates"
  | "duration" | "weekly" | "total" | "assignments" | "report" | "updated" | "actions";

const columns: Array<{ key: ColumnKey; label: string; defaultVisible: boolean }> = [
  { key: "code", label: "Código", defaultVisible: true },
  { key: "client", label: "Cliente", defaultVisible: true },
  { key: "title", label: "Trabajo", defaultVisible: true },
  { key: "type", label: "Tipo", defaultVisible: true },
  { key: "size", label: "Tamaño", defaultVisible: true },
  { key: "status", label: "Estado", defaultVisible: true },
  { key: "source", label: "Origen", defaultVisible: false },
  { key: "dates", label: "Fechas", defaultVisible: false },
  { key: "duration", label: "Duración", defaultVisible: false },
  { key: "weekly", label: "HH sem.", defaultVisible: true },
  { key: "total", label: "HH total", defaultVisible: true },
  { key: "assignments", label: "Asignación", defaultVisible: true },
  { key: "report", label: "Reporte", defaultVisible: true },
  { key: "updated", label: "Actualización", defaultVisible: false },
  { key: "actions", label: "Acciones", defaultVisible: true },
];

const storageKey = "tbx-control-diseno-columns-v1";

function defaultVisibility() {
  return Object.fromEntries(columns.map((column) => [column.key, column.defaultVisible])) as Record<ColumnKey, boolean>;
}

export function WorkItemsTable({ items, role, reportMode = false, onOpenItem }: { items: WorkItem[]; role: AppRole; reportMode?: boolean; onOpenItem: (item: WorkItem) => void }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [report, setReport] = useState(reportMode ? "yes" : "all");
  const [visible, setVisible] = useState<Record<ColumnKey, boolean>>(() => {
    if (typeof window === "undefined") return defaultVisibility();
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return defaultVisibility();
    try {
      return { ...defaultVisibility(), ...JSON.parse(saved) } as Record<ColumnKey, boolean>;
    } catch {
      return defaultVisibility();
    }
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(visible));
  }, [visible]);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesSearch = !q || [item.code, item.client_name, item.title, item.comments, item.source_reference].filter(Boolean).join(" ").toLowerCase().includes(q);
      const matchesType = type === "all" || item.type === type;
      const matchesStatus = status === "all" || item.status === status;
      const matchesReport = report === "all" || item.report_to_cesar === (report === "yes");
      return matchesSearch && matchesType && matchesStatus && matchesReport;
    });
  }, [items, search, type, status, report]);

  function toggleColumn(key: ColumnKey) {
    setVisible((current) => ({ ...current, [key]: !current[key] }));
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="grid flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(240px,1fr)_180px_180px_170px]">
          <label className="relative"><Search className="absolute left-3 top-3 text-[var(--tbx-text-subtle)]" size={17} /><input className="tbx-input pl-10" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente, título o ticket…" /></label>
          <select className="tbx-input" value={type} onChange={(e) => setType(e.target.value)}><option value="all">Todos los tipos</option>{Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <select className="tbx-input" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">Todos los estados</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <select className="tbx-input" value={report} onChange={(e) => setReport(e.target.value)}><option value="all">Todos</option><option value="yes">Reportar a César</option><option value="no">Solo internos</option></select>
        </div>
        <div ref={menuRef} className="relative">
          <button className="tbx-button-secondary w-full xl:w-auto" type="button" onClick={() => setMenuOpen((open) => !open)}><Columns3 size={17} /> Columnas</button>
          {menuOpen ? (
            <div className="absolute right-0 top-12 z-20 w-64 rounded-xl border border-[var(--tbx-border)] bg-[var(--tbx-surface)] p-3 shadow-xl">
              <div className="mb-2 flex items-center justify-between"><span className="tbx-mono text-[.68rem] uppercase tracking-[.12em] text-[var(--tbx-text-subtle)]">Mostrar columnas</span><Settings2 size={15} /></div>
              <div className="max-h-80 space-y-1 overflow-auto">
                {columns.map((column) => (
                  <label key={column.key} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-[var(--tbx-surface-2)]"><input type="checkbox" checked={visible[column.key]} onChange={() => toggleColumn(column.key)} /> <span className="text-sm text-[var(--tbx-text)]">{column.label}</span></label>
                ))}
              </div>
              <button className="tbx-button-ghost mt-2 w-full" type="button" onClick={() => setVisible(defaultVisibility())}>Restablecer</button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between text-sm"><span>{filtered.length} de {items.length} registros</span><span className="tbx-mono text-[.68rem] uppercase tracking-[.1em] text-[var(--tbx-text-subtle)]">preferencias guardadas en este navegador</span></div>

      <div className="tbx-table-scroll">
        <table className="tbx-table">
          <thead><tr>
            {visible.code && <th>Código</th>}
            {visible.client && <th className="sticky-left">Cliente</th>}
            {visible.title && <th>Trabajo</th>}
            {visible.type && <th>Tipo</th>}
            {visible.size && <th>Tamaño</th>}
            {visible.status && <th>Estado</th>}
            {visible.source && <th>Origen</th>}
            {visible.dates && <th>Fechas</th>}
            {visible.duration && <th>Duración</th>}
            {visible.weekly && <th>HH sem.</th>}
            {visible.total && <th>HH total</th>}
            {visible.assignments && <th>Asignación</th>}
            {visible.report && <th>Reporte</th>}
            {visible.updated && <th>Actualización</th>}
            {visible.actions && <th>Acciones</th>}
          </tr></thead>
          <tbody>
            {filtered.map((item) => (
              <tr
                key={item.id}
                className="cursor-pointer"
                tabIndex={0}
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest("a,button,input,select,form")) return;
                  onOpenItem(item);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onOpenItem(item);
                }}
              >
                {visible.code && <td className="tbx-mono text-xs">{item.code}</td>}
                {visible.client && <td className="sticky-left min-w-44 font-semibold text-[var(--tbx-text)]">{item.client_name}</td>}
                {visible.title && <td className="min-w-72"><p className="font-semibold text-[var(--tbx-text)]">{item.title}</p>{item.comments ? <p className="mt-1 line-clamp-2 text-xs">{item.comments}</p> : null}</td>}
                {visible.type && <td><Badge tone="blue">{TYPE_LABELS[item.type]}</Badge></td>}
                {visible.size && <td><Badge tone={item.size === "pending" ? "amber" : item.size === "large" ? "blue" : "neutral"}>{SIZE_LABELS[item.size]}</Badge></td>}
                {visible.status && <td><Badge tone={item.status === "completed" ? "green" : item.status === "blocked" ? "red" : "neutral"}>{STATUS_LABELS[item.status]}</Badge></td>}
                {visible.source && <td><span>{SOURCE_LABELS[item.source]}</span>{item.source_reference ? <p className="tbx-mono mt-1 text-xs">{item.source_reference}</p> : null}{item.source_url ? <a className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--tbx-support)]" href={item.source_url} target="_blank" rel="noreferrer">Abrir <ExternalLink size={12} /></a> : null}</td>}
                {visible.dates && <td className="whitespace-nowrap">{formatDate(item.start_date)}<br /><span className="text-xs">a {formatDate(item.end_date)}</span></td>}
                {visible.duration && <td>{formatHours(item.duration_weeks)} sem.</td>}
                {visible.weekly && <td className="tbx-mono font-semibold text-[var(--tbx-text)]">{formatHours(item.hh_weekly)}</td>}
                {visible.total && <td className="tbx-mono font-semibold text-[var(--tbx-text)]">{formatHours(item.hh_total)}</td>}
                {visible.assignments && <td className="min-w-44">{item.assignments.length ? item.assignments.map((assignment) => <div key={assignment.id} className="flex justify-between gap-4"><span>{assignment.team_member.short_name}</span><strong className="tbx-mono text-xs text-[var(--tbx-text)]">{Math.round(assignment.percentage * 100)}%</strong></div>) : "—"}</td>}
                {visible.report && <td><Badge tone={item.report_to_cesar ? "green" : "neutral"}>{item.report_to_cesar ? "Sí" : "No"}</Badge></td>}
                {visible.updated && <td className="whitespace-nowrap text-xs">{formatDateTime(item.updated_at)}</td>}
                {visible.actions && <td><div className="flex items-center gap-1">
                  <button className="tbx-button-ghost" type="button" onClick={() => onOpenItem(item)} title={canEdit(role) ? "Editar" : "Ver"}><Pencil size={16} /></button>
                  {canEdit(role) && item.type === "task" && !item.report_to_cesar ? <form action={promoteWorkItemAction}><input type="hidden" name="id" value={item.id} /><button className="tbx-button-ghost" type="submit" title="Promover a requerimiento"><TrendingUp size={16} /></button></form> : null}
                  {role === "admin" ? <form action={deleteWorkItemAction} onSubmit={(e) => { if (!window.confirm("¿Eliminar este registro?")) e.preventDefault(); }}><input type="hidden" name="id" value={item.id} /><button className="tbx-button-ghost text-[var(--tbx-danger)]" type="submit" title="Eliminar"><Trash2 size={16} /></button></form> : null}
                </div></td>}
              </tr>
            ))}
            {!filtered.length ? <tr><td colSpan={15} className="py-12 text-center">No hay registros para estos filtros.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
