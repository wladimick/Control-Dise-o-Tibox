"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { importDailyTasksAction } from "@/app/(app)/tareas-diarias/actions";
import type { TeamMember, WorkItem } from "@/lib/types";

type DraftTask = {
  id: string;
  team_member_id: string;
  task_date: string;
  client_name: string;
  description: string;
  hours: number;
  status: "pending" | "done" | "blocked";
  source: "manual" | "support" | "projects" | "email" | "commercial" | "other";
  work_item_id: string | null;
  source_reference: string | null;
  source_url: string | null;
  comments: string | null;
};

function parseHours(value: string) {
  const text = value.toLowerCase().trim().replace(",", ".");
  const hours = text.match(/(\d+(?:\.\d+)?)\s*h/);
  const minutes = text.match(/(\d+(?:\.\d+)?)\s*m/);
  if (hours || minutes) return Number(hours?.[1] ?? 0) + Number(minutes?.[1] ?? 0) / 60;
  const plain = Number(text.replace(/[^0-9.]/g, ""));
  return Number.isFinite(plain) ? plain : 0;
}

function splitCsvLine(line: string, delimiter: string) {
  const values: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && quoted && line[index + 1] === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === delimiter && !quoted) {
      values.push(field.trim());
      field = "";
    } else field += char;
  }
  values.push(field.trim());
  return values;
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function matchWorkItem(client: string, description: string, workItems: WorkItem[]) {
  const clientKey = normalize(client);
  const candidates = workItems.filter((item) => normalize(item.client_name) === clientKey);
  if (candidates.length === 1) return candidates[0].id;
  const descriptionKey = normalize(description);
  const exact = candidates.find((item) => descriptionKey.includes(normalize(item.title)) || normalize(item.title).includes(descriptionKey));
  return exact?.id ?? null;
}

function makeTask(memberId: string, workItems: WorkItem[], client: string, description: string, hours: number, date?: string): DraftTask {
  return {
    id: crypto.randomUUID(),
    team_member_id: memberId,
    task_date: date || new Date().toISOString().slice(0, 10),
    client_name: client.trim(),
    description: description.trim(),
    hours: Math.round(hours * 100) / 100,
    status: "done",
    source: "manual",
    work_item_id: matchWorkItem(client, description, workItems),
    source_reference: null,
    source_url: null,
    comments: null,
  };
}

function parseText(text: string, memberId: string, workItems: WorkItem[]) {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).flatMap((line) => {
    const pipe = line.split("|").map((part) => part.trim());
    if (pipe.length >= 3) {
      const firstHours = parseHours(pipe[0]);
      if (firstHours > 0) return [makeTask(memberId, workItems, pipe[1], pipe[2], firstHours)];
      const lastHours = parseHours(pipe[pipe.length - 1]);
      if (lastHours > 0) return [makeTask(memberId, workItems, pipe[0], pipe.slice(1, -1).join(" | "), lastHours)];
    }

    const dash = line.split(/\s+-\s+/).map((part) => part.trim());
    if (dash.length >= 3) {
      const hours = parseHours(dash[dash.length - 1]);
      if (hours > 0) return [makeTask(memberId, workItems, dash[0], dash.slice(1, -1).join(" - "), hours)];
    }
    return [];
  });
}

function parseCsv(text: string, memberId: string, workItems: WorkItem[]) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const delimiter = (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0) ? ";" : ",";
  const headers = splitCsvLine(lines[0], delimiter).map(normalize);
  const indexOf = (...names: string[]) => headers.findIndex((header) => names.includes(header));
  const indexes = {
    date: indexOf("fecha", "date"),
    client: indexOf("cliente", "client"),
    description: indexOf("tarea", "descripcion", "description"),
    hours: indexOf("hh", "horas", "hours"),
    status: indexOf("estado", "status"),
    source: indexOf("origen", "source"),
    ticket: indexOf("ticket", "referencia"),
    comments: indexOf("comentarios", "comments"),
  };
  if (indexes.client < 0 || indexes.description < 0 || indexes.hours < 0) return [];

  return lines.slice(1).flatMap((line) => {
    const values = splitCsvLine(line, delimiter);
    const hours = parseHours(values[indexes.hours] ?? "");
    if (!hours) return [];
    const task = makeTask(memberId, workItems, values[indexes.client] ?? "", values[indexes.description] ?? "", hours, indexes.date >= 0 ? values[indexes.date] : undefined);
    const status = normalize(indexes.status >= 0 ? values[indexes.status] ?? "" : "");
    task.status = status.includes("bloq") ? "blocked" : status.includes("pend") ? "pending" : "done";
    const source = normalize(indexes.source >= 0 ? values[indexes.source] ?? "" : "");
    task.source = source.includes("soporte") ? "support" : source.includes("project") ? "projects" : source.includes("correo") || source.includes("email") ? "email" : source.includes("comercial") ? "commercial" : "manual";
    task.source_reference = indexes.ticket >= 0 ? values[indexes.ticket] || null : null;
    task.comments = indexes.comments >= 0 ? values[indexes.comments] || null : null;
    return [task];
  });
}

export function DailyTasksBatchModal({ member, workItems, onClose }: { member: TeamMember; workItems: WorkItem[]; onClose: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<"text" | "csv">("text");
  const [text, setText] = useState("");
  const [tasks, setTasks] = useState<DraftTask[]>([]);
  const [state, action, pending] = useActionState(importDailyTasksAction, {});
  const validTasks = useMemo(() => tasks.filter((task) => task.client_name.trim().length >= 2 && task.description.trim().length >= 3 && task.hours >= .25), [tasks]);
  const total = validTasks.reduce((sum, task) => sum + task.hours, 0);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  function preview() {
    setTasks(mode === "text" ? parseText(text, member.id, workItems) : parseCsv(text, member.id, workItems));
  }

  function updateTask(id: string, patch: Partial<DraftTask>) {
    setTasks((current) => current.map((task) => task.id === id ? { ...task, ...patch } : task));
  }

  return (
    <div className="tbx-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onClose(); }}>
      <section className="tbx-modal tbx-modal-wide" role="dialog" aria-modal="true">
        <header className="tbx-modal-header">
          <div><span className="tbx-mono text-[.68rem] uppercase tracking-[.16em] text-[var(--tbx-support)]">Carga rápida · {member.short_name}</span><h2 className="mt-1 text-2xl font-bold text-[var(--tbx-text)]">Agregar tareas en lote</h2><p className="mt-1 text-sm">Pega varias líneas o importa un CSV y revisa la vista previa antes de guardar.</p></div>
          <button className="tbx-icon-button" type="button" onClick={onClose}><X size={19} /></button>
        </header>

        <form action={action} className="flex min-h-0 flex-1 flex-col">
          <input type="hidden" name="tasks_json" value={JSON.stringify(validTasks.map(({ id: _id, ...task }) => task))} />
          <div className="tbx-modal-body space-y-4">
            <div className="flex gap-2">
              <button className={mode === "text" ? "tbx-button-primary" : "tbx-button-secondary"} type="button" onClick={() => { setMode("text"); setTasks([]); }}>Texto rápido</button>
              <button className={mode === "csv" ? "tbx-button-primary" : "tbx-button-secondary"} type="button" onClick={() => { setMode("csv"); setTasks([]); }}>CSV</button>
            </div>

            {mode === "text" ? (
              <div>
                <textarea className="tbx-input min-h-40 font-mono text-sm" value={text} onChange={(event) => setText(event.target.value)} placeholder={"1,5 | TIBOX | Revisar formulario de privacidad\nVGM - Crear carpetas SharePoint - 2h\nEcoscience | Revisar DNS | 30 min"} />
                <p className="tbx-help">Formatos aceptados: HH | Cliente | Tarea, Cliente | Tarea | HH o Cliente - Tarea - HH.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="tbx-upload-zone"><FileText size={24} /><span className="flex-1"><strong className="block text-[var(--tbx-text)]">Seleccionar CSV</strong><span className="text-sm">Columnas mínimas: cliente, tarea y hh.</span></span><input className="sr-only" type="file" accept=".csv,text/csv" onChange={async (event) => { const file = event.target.files?.[0]; if (file) { const content = await file.text(); setText(content); setTasks(parseCsv(content, member.id, workItems)); } }} /></label>
                <p className="tbx-help">También puede incluir fecha, estado, origen, ticket y comentarios.</p>
              </div>
            )}

            <button className="tbx-button-secondary" type="button" onClick={preview} disabled={!text.trim()}><FileText size={17} /> Interpretar y revisar</button>

            {tasks.length ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3"><p><strong className="text-[var(--tbx-text)]">{validTasks.length} tareas válidas</strong> · {total.toLocaleString("es-CL", { maximumFractionDigits: 2 })} HH</p><p className="text-xs">Las asociaciones se sugieren solo cuando hay una coincidencia clara.</p></div>
                <div className="tbx-table-scroll max-h-80">
                  <table className="tbx-table min-w-[980px]">
                    <thead><tr><th>Fecha</th><th>Cliente</th><th>Tarea</th><th>HH</th><th>Estado</th><th>Trabajo principal</th><th></th></tr></thead>
                    <tbody>{tasks.map((task) => <tr key={task.id}>
                      <td><input className="tbx-input min-w-36" type="date" value={task.task_date} onChange={(event) => updateTask(task.id, { task_date: event.target.value })} /></td>
                      <td><input className="tbx-input min-w-40" value={task.client_name} onChange={(event) => updateTask(task.id, { client_name: event.target.value })} /></td>
                      <td><input className="tbx-input min-w-72" value={task.description} onChange={(event) => updateTask(task.id, { description: event.target.value })} /></td>
                      <td><input className="tbx-input w-24" type="number" min=".25" step=".25" value={task.hours} onChange={(event) => updateTask(task.id, { hours: Number(event.target.value) })} /></td>
                      <td><select className="tbx-input min-w-32" value={task.status} onChange={(event) => updateTask(task.id, { status: event.target.value as DraftTask["status"] })}><option value="done">Realizada</option><option value="pending">Pendiente</option><option value="blocked">Bloqueada</option></select></td>
                      <td><select className="tbx-input min-w-64" value={task.work_item_id ?? ""} onChange={(event) => updateTask(task.id, { work_item_id: event.target.value || null })}><option value="">Sin asociar</option>{workItems.map((item) => <option key={item.id} value={item.id}>{item.client_name} · {item.title}</option>)}</select></td>
                      <td><button className="tbx-button-ghost text-[var(--tbx-danger)]" type="button" onClick={() => setTasks((current) => current.filter((item) => item.id !== task.id))}>Quitar</button></td>
                    </tr>)}</tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {state.error ? <p className="rounded-xl border border-[color:var(--tbx-danger)]/30 p-3 text-sm text-[var(--tbx-danger)]">{state.error}</p> : null}
            {state.ok ? <p className="rounded-xl border border-[color:var(--tbx-success)]/30 p-3 text-sm font-semibold text-[var(--tbx-success)]">{state.message}</p> : null}
          </div>

          <footer className="tbx-modal-footer">
            <button className="tbx-button-ghost" type="button" onClick={onClose}>{state.ok ? "Cerrar" : "Cancelar"}</button>
            {!state.ok ? <button className="tbx-button-primary min-w-40" type="submit" disabled={pending || !validTasks.length}><Upload size={17} />{pending ? "Guardando…" : `Agregar ${validTasks.length || ""} tareas`}</button> : null}
          </footer>
        </form>
      </section>
    </div>
  );
}
