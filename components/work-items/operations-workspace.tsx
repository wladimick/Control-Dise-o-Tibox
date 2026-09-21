"use client";

import { useMemo, useState } from "react";
import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight, Columns3, LayoutList, Plus, Search, SlidersHorizontal, Sun, Users } from "lucide-react";
import { WorkItemModal } from "@/components/work-items/work-item-modal";
import { AvatarStack, PersonAvatar } from "@/components/ui/person-avatar";
import { PRIORITY_LABELS, SOURCE_LABELS, STATUS_LABELS } from "@/lib/constants";
import type { AppRole, TeamMember, WorkItem, WorkItemSource, WorkItemStatus, WorkPriority } from "@/lib/types";
import { canEdit } from "@/lib/utils";

type ViewMode = "list" | "week" | "day" | "calendar";
type ModalState = { type: "new" } | { type: "edit"; item: WorkItem } | null;
type ColumnKey = "client" | "owner" | "status" | "priority" | "date" | "source" | "hours";

const views: Array<{ id: ViewMode; label: string; icon: typeof LayoutList }> = [
  { id: "list", label: "Lista", icon: LayoutList },
  { id: "week", label: "Semana", icon: CalendarRange },
  { id: "day", label: "Día", icon: Sun },
  { id: "calendar", label: "Calendario", icon: CalendarDays },
];

const defaultColumns: Record<ColumnKey, boolean> = { client: true, owner: true, status: true, priority: true, date: true, source: true, hours: false };

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDate(value: string | null) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function taskDate(item: WorkItem) {
  return item.due_date ?? item.end_date ?? item.start_date;
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function monthCells(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = addDays(first, -((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function formatShort(value: string | null) {
  const date = parseDate(value);
  return date ? date.toLocaleDateString("es-CL", { day: "numeric", month: "short" }) : "Sin fecha";
}

function StatusPill({ status }: { status: WorkItemStatus }) {
  return <span className={`ops-pill ops-status-${status}`}>{STATUS_LABELS[status]}</span>;
}

function PriorityPill({ priority }: { priority: WorkPriority }) {
  return <span className={`ops-priority ops-priority-${priority}`}>{PRIORITY_LABELS[priority]}</span>;
}

function SourcePill({ source, reference }: { source: WorkItemSource; reference: string | null }) {
  return <span className={`ops-source ops-source-${source}`}>{SOURCE_LABELS[source]}{reference ? ` · ${reference}` : ""}</span>;
}

function owners(item: WorkItem) {
  return item.assignments.map((assignment) => assignment.team_member);
}

export function OperationsWorkspace({ items, teamMembers, role }: { items: WorkItem[]; teamMembers: TeamMember[]; role: AppRole }) {
  const [view, setView] = useState<ViewMode>("list");
  const [search, setSearch] = useState("");
  const [member, setMember] = useState("all");
  const [status, setStatus] = useState("active");
  const [priority, setPriority] = useState("all");
  const [source, setSource] = useState("all");
  const [columns, setColumns] = useState(defaultColumns);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [focusDate, setFocusDate] = useState(() => new Date());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      const text = [item.code, item.client_name, item.title, item.description, item.comments, item.source_reference].filter(Boolean).join(" ").toLowerCase();
      const memberMatch = member === "all" || item.assignments.some((assignment) => assignment.team_member.id === member);
      const statusMatch = status === "all" || (status === "active" ? !["completed", "archived", "discarded"].includes(item.status) : item.status === status);
      return (!q || text.includes(q)) && memberMatch && statusMatch && (priority === "all" || item.priority === priority) && (source === "all" || item.source === source);
    });
  }, [items, search, member, status, priority, source]);

  const activeCount = items.filter((item) => !["completed", "archived", "discarded"].includes(item.status)).length;
  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const overdueCount = items.filter((item) => {
    const date = taskDate(item);
    return date && date < dateKey(new Date()) && !["completed", "archived", "discarded"].includes(item.status);
  }).length;

  return (
    <>
      <div className="ops-heading">
        <div>
          <p className="ops-eyebrow">Operación Diseño</p>
          <h1>Trabajo del equipo</h1>
          <p>Projects, Titrack, correo y trabajo interno en un solo lugar.</p>
        </div>
        {canEdit(role) ? <button className="tbx-button-primary" type="button" onClick={() => setModal({ type: "new" })}><Plus size={17} /> Nueva tarea</button> : null}
      </div>

      <div className="ops-summary">
        <div><strong>{activeCount}</strong><span>Activas</span></div>
        <div><strong>{overdueCount}</strong><span>Atrasadas</span></div>
        <div><strong>{blockedCount}</strong><span>Bloqueadas</span></div>
        <div className="ops-team-summary"><AvatarStack members={teamMembers} /><span>{teamMembers.length} personas · Diseño</span></div>
      </div>

      <section className="ops-board">
        <div className="ops-viewbar">
          <div className="ops-tabs">
            {views.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={view === id ? "is-active" : ""} onClick={() => setView(id)}><Icon size={16} /> {label}</button>)}
          </div>
          <span className="ops-count">{filtered.length} tareas</span>
        </div>

        <div className="ops-toolbar">
          <label className="ops-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar tarea, cliente o ticket…" /></label>
          <select value={member} onChange={(event) => setMember(event.target.value)}><option value="all">Todas las personas</option>{teamMembers.map((person) => <option key={person.id} value={person.id}>{person.short_name}</option>)}</select>
          <select value={status} onChange={(event) => setStatus(event.target.value)}><option value="active">Trabajo activo</option><option value="all">Todos los estados</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="all">Toda prioridad</option>{Object.entries(PRIORITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          <select value={source} onChange={(event) => setSource(event.target.value)}><option value="all">Todo origen</option>{Object.entries(SOURCE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          {view === "list" ? <div className="relative"><button className="ops-tool-button" type="button" onClick={() => setColumnsOpen((current) => !current)}><Columns3 size={16} /> Columnas</button>{columnsOpen ? <div className="ops-column-menu">{Object.entries({ client: "Cliente", owner: "Responsable", status: "Estado", priority: "Prioridad", date: "Fecha", source: "Origen", hours: "HH" }).map(([key, label]) => <label key={key}><input type="checkbox" checked={columns[key as ColumnKey]} onChange={() => setColumns((current) => ({ ...current, [key]: !current[key as ColumnKey] }))} /> {label}</label>)}</div> : null}</div> : null}
          <SlidersHorizontal size={16} className="ops-filter-icon" />
        </div>

        {view === "list" ? <ListView items={filtered} columns={columns} onOpen={(item) => setModal({ type: "edit", item })} /> : null}
        {view === "week" ? <WeekView items={filtered} teamMembers={teamMembers} focusDate={focusDate} setFocusDate={setFocusDate} onOpen={(item) => setModal({ type: "edit", item })} /> : null}
        {view === "day" ? <DayView items={filtered} teamMembers={teamMembers} focusDate={focusDate} setFocusDate={setFocusDate} onOpen={(item) => setModal({ type: "edit", item })} /> : null}
        {view === "calendar" ? <CalendarView items={filtered} focusDate={focusDate} setFocusDate={setFocusDate} onOpen={(item) => setModal({ type: "edit", item })} /> : null}
      </section>

      {modal?.type === "new" ? <WorkItemModal teamMembers={teamMembers} role={role} onClose={() => setModal(null)} /> : null}
      {modal?.type === "edit" ? <WorkItemModal key={modal.item.id} item={modal.item} teamMembers={teamMembers} role={role} onClose={() => setModal(null)} /> : null}
    </>
  );
}

function ListView({ items, columns, onOpen }: { items: WorkItem[]; columns: Record<ColumnKey, boolean>; onOpen: (item: WorkItem) => void }) {
  return <div className="ops-list"><div className="ops-list-head"><span>Tarea</span>{columns.client && <span>Cliente</span>}{columns.owner && <span>Responsable</span>}{columns.status && <span>Estado</span>}{columns.priority && <span>Prioridad</span>}{columns.date && <span>Fecha</span>}{columns.source && <span>Origen</span>}{columns.hours && <span>HH</span>}</div>{items.map((item) => <button key={item.id} type="button" className="ops-list-row" onClick={() => onOpen(item)}><span className="ops-task-cell"><strong>{item.title}</strong><small>{item.code}{item.parent_work_item_id ? " · Subtarea" : ""}</small></span>{columns.client && <span>{item.client_name}</span>}{columns.owner && <span><AvatarStack members={owners(item)} /></span>}{columns.status && <span><StatusPill status={item.status} /></span>}{columns.priority && <span><PriorityPill priority={item.priority} /></span>}{columns.date && <span>{formatShort(taskDate(item))}</span>}{columns.source && <span><SourcePill source={item.source} reference={item.source_reference} /></span>}{columns.hours && <span>{item.hh_total.toLocaleString("es-CL")} HH</span>}</button>)}{!items.length ? <EmptyState /> : null}</div>;
}

function DateNavigator({ label, previous, next, today }: { label: string; previous: () => void; next: () => void; today: () => void }) {
  return <div className="ops-date-nav"><button type="button" onClick={previous}><ChevronLeft size={17} /></button><button type="button" className="ops-today" onClick={today}>Hoy</button><strong>{label}</strong><button type="button" onClick={next}><ChevronRight size={17} /></button></div>;
}

function WeekView({ items, teamMembers, focusDate, setFocusDate, onOpen }: { items: WorkItem[]; teamMembers: TeamMember[]; focusDate: Date; setFocusDate: (date: Date) => void; onOpen: (item: WorkItem) => void }) {
  const start = startOfWeek(focusDate);
  const days = Array.from({ length: 5 }, (_, index) => addDays(start, index));
  const end = days[4];
  const label = `${start.toLocaleDateString("es-CL", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("es-CL", { day: "numeric", month: "short" })}`;
  return <div className="ops-schedule"><DateNavigator label={label} previous={() => setFocusDate(addDays(focusDate, -7))} next={() => setFocusDate(addDays(focusDate, 7))} today={() => setFocusDate(new Date())} /><div className="ops-week-grid"><div className="ops-week-corner">Equipo</div>{days.map((day) => <div key={dateKey(day)} className="ops-week-day"><strong>{day.toLocaleDateString("es-CL", { weekday: "short" })}</strong><span>{day.getDate()}</span></div>)}{teamMembers.map((person) => <div key={person.id} className="contents"><div className="ops-person-cell"><PersonAvatar member={person} /><span><strong>{person.short_name}</strong><small>{person.role_title || person.area}</small></span></div>{days.map((day) => { const tasks = items.filter((item) => taskDate(item) === dateKey(day) && item.assignments.some((assignment) => assignment.team_member.id === person.id)); return <div key={`${person.id}-${dateKey(day)}`} className="ops-week-slot">{tasks.slice(0, 4).map((item) => <button key={item.id} type="button" className={`ops-mini-task ops-priority-border-${item.priority}`} onClick={() => onOpen(item)}><strong>{item.title}</strong><small>{item.client_name}</small></button>)}{tasks.length > 4 ? <span className="ops-more">+{tasks.length - 4} más</span> : null}</div>; })}</div>)}</div></div>;
}

function DayView({ items, teamMembers, focusDate, setFocusDate, onOpen }: { items: WorkItem[]; teamMembers: TeamMember[]; focusDate: Date; setFocusDate: (date: Date) => void; onOpen: (item: WorkItem) => void }) {
  const key = dateKey(focusDate);
  const label = focusDate.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
  return <div className="ops-schedule"><DateNavigator label={label} previous={() => setFocusDate(addDays(focusDate, -1))} next={() => setFocusDate(addDays(focusDate, 1))} today={() => setFocusDate(new Date())} /><div className="ops-day-columns">{teamMembers.map((person) => { const tasks = items.filter((item) => taskDate(item) === key && item.assignments.some((assignment) => assignment.team_member.id === person.id)); return <section key={person.id} className="ops-person-day"><header><PersonAvatar member={person} size="lg" /><div><strong>{person.full_name}</strong><span>{tasks.length} tareas</span></div></header><div>{tasks.map((item) => <button key={item.id} type="button" className="ops-day-task" onClick={() => onOpen(item)}><div><PriorityPill priority={item.priority} /><StatusPill status={item.status} /></div><strong>{item.title}</strong><span>{item.client_name}</span><small>{item.hh_total ? `${item.hh_total} HH · ` : ""}{SOURCE_LABELS[item.source]}</small></button>)}{!tasks.length ? <p className="ops-person-empty">Sin tareas para este día.</p> : null}</div></section>; })}</div></div>;
}

function CalendarView({ items, focusDate, setFocusDate, onOpen }: { items: WorkItem[]; focusDate: Date; setFocusDate: (date: Date) => void; onOpen: (item: WorkItem) => void }) {
  const month = new Date(focusDate.getFullYear(), focusDate.getMonth(), 1);
  const cells = monthCells(month);
  const label = month.toLocaleDateString("es-CL", { month: "long", year: "numeric" });
  return <div className="ops-schedule"><DateNavigator label={label} previous={() => setFocusDate(new Date(month.getFullYear(), month.getMonth() - 1, 1))} next={() => setFocusDate(new Date(month.getFullYear(), month.getMonth() + 1, 1))} today={() => setFocusDate(new Date())} /><div className="ops-calendar-head">{["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => <span key={day}>{day}</span>)}</div><div className="ops-calendar-grid">{cells.map((day) => { const key = dateKey(day); const dayItems = items.filter((item) => taskDate(item) === key); const inMonth = day.getMonth() === month.getMonth(); return <div key={key} className={`ops-calendar-cell ${inMonth ? "" : "is-outside"} ${key === dateKey(new Date()) ? "is-today" : ""}`}><span className="ops-calendar-number">{day.getDate()}</span><div>{dayItems.slice(0, 3).map((item) => <button key={item.id} type="button" className={`ops-calendar-task ops-priority-border-${item.priority}`} onClick={() => onOpen(item)}><strong>{item.client_name}</strong><span>{item.title}</span></button>)}{dayItems.length > 3 ? <small>+{dayItems.length - 3} más</small> : null}</div></div>; })}</div></div>;
}

function EmptyState() {
  return <div className="ops-empty"><Users size={30} /><strong>No hay tareas para estos filtros</strong><span>Cambia los filtros o agrega una nueva tarea.</span></div>;
}
