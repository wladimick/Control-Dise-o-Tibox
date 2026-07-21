"use client";

import { Bot, Check, Clipboard, ExternalLink, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { TeamMember, WorkItem } from "@/lib/types";

type Period = "daily" | "weekly";

function isoToday() {
  return new Date().toISOString().slice(0, 10);
}

function activeWorkList(items: WorkItem[]) {
  return items
    .filter((item) => !["completed", "archived", "discarded"].includes(item.status))
    .slice(0, 30)
    .map((item) => `- ${item.code} | ${item.client_name} | ${item.title}`)
    .join("\n");
}

function buildPrompt(member: TeamMember, period: Period, items: WorkItem[]) {
  const works = activeWorkList(items) || "- No hay trabajos principales activos disponibles.";
  const common = `Actúa como asistente de registro de tareas laborales para ${member.full_name}.

Tu objetivo es entrevistarme para reconstruir el trabajo realizado y entregar un resultado listo para pegar en la aplicación Control Diseño TI.

Haz preguntas breves, de una en una, sobre:
1. Hora de inicio y término de cada bloque.
2. Cliente, proyecto o aplicación involucrada.
3. Descripción concreta del trabajo realizado.
4. Si trabajé simultáneamente en más de un proyecto.
5. Cómo distribuir el tiempo cuando hubo trabajo simultáneo.
6. Si la tarea quedó realizada, pendiente o bloqueada.
7. Si existe ticket, referencia o trabajo principal asociado.

Reglas obligatorias:
- No inventes información.
- Pregunta cuando falte un dato.
- No dupliques horas.
- Convierte minutos a horas decimales.
- Usa coma como separador decimal en el resultado de texto.
- La suma de tareas debe coincidir con el total de horas declarado.
- Mantén descripciones breves, claras y profesionales.
- Antes del resultado final, muestra un resumen de horas y solicita confirmación.
- Después de mi confirmación, entrega únicamente el bloque final, sin explicaciones ni viñetas.

Trabajos principales activos disponibles para sugerir asociaciones:
${works}

No es obligatorio asociar una tarea. Si no hay coincidencia clara, déjala sin asociación.`;

  if (period === "weekly") {
    return `${common}

El registro corresponde a una semana completa. Pregúntame día por día.

FORMATO FINAL OBLIGATORIO: CSV con encabezados exactos:
fecha,cliente,tarea,hh,estado,origen,ticket,comentarios

Ejemplo:
2026-07-21,Alertas DT,Revisión y ajustes de notificaciones,1.25,realizada,manual,,
2026-07-21,WebOps,Revisión del módulo de clientes,1.25,realizada,manual,,
2026-07-22,VGM Consultores,Creación de carpetas SharePoint,2,realizada,projects,637,

Usa fechas YYYY-MM-DD, HH con punto decimal y estado realizada, pendiente o bloqueada. Comienza preguntándome qué día de la semana quiero reconstruir primero.`;
  }

  return `${common}

El registro corresponde al día ${isoToday()}.

FORMATO FINAL OBLIGATORIO:
HH | Cliente | Descripción

Ejemplo:
1,25 | Alertas DT | Revisión y ajustes de notificaciones
1,25 | WebOps | Revisión del módulo de clientes
0,50 | TIBOX | Revisión del formulario de privacidad

Comienza preguntándome entre qué horas trabajé y qué hice en el primer bloque.`;
}

export function DailyTasksAiAssistantModal({
  member,
  workItems,
  onClose,
  onOpenBatch,
}: {
  member: TeamMember;
  workItems: WorkItem[];
  onClose: () => void;
  onOpenBatch: () => void;
}) {
  const [period, setPeriod] = useState<Period>("daily");
  const [copied, setCopied] = useState<"prompt" | "response" | null>(null);
  const [response, setResponse] = useState("");
  const prompt = useMemo(() => buildPrompt(member, period, workItems), [member, period, workItems]);

  useEffect(() => {
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", key);
    return () => { document.body.style.overflow = old; window.removeEventListener("keydown", key); };
  }, [onClose]);

  async function copy(value: string, kind: "prompt" | "response") {
    if (!value.trim()) return;
    await navigator.clipboard.writeText(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1800);
  }

  async function copyAndOpenBatch() {
    if (response.trim()) await navigator.clipboard.writeText(response.trim());
    onClose();
    onOpenBatch();
  }

  return (
    <div className="tbx-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="tbx-modal tbx-modal-wide" role="dialog" aria-modal="true">
        <header className="tbx-modal-header">
          <div>
            <span className="tbx-mono text-[.68rem] uppercase tracking-[.16em] text-[var(--tbx-support)]">Asistente IA · {member.short_name}</span>
            <h2 className="mt-1 text-2xl font-bold text-[var(--tbx-text)]">Preparar registro con IA</h2>
            <p className="mt-1 text-sm">Copia el prompt en ChatGPT, Claude o Gemini y pega aquí el resultado final.</p>
          </div>
          <button className="tbx-icon-button" type="button" onClick={onClose}><X size={19} /></button>
        </header>

        <div className="tbx-modal-body space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" className={period === "daily" ? "tbx-panel border-[var(--tbx-border-accent)] p-4 text-left" : "tbx-panel p-4 text-left"} onClick={() => setPeriod("daily")}>
              <strong className="block text-[var(--tbx-text)]">Registro diario</strong>
              <span className="text-sm">La IA entrega líneas HH | Cliente | Tarea.</span>
            </button>
            <button type="button" className={period === "weekly" ? "tbx-panel border-[var(--tbx-border-accent)] p-4 text-left" : "tbx-panel p-4 text-left"} onClick={() => setPeriod("weekly")}>
              <strong className="block text-[var(--tbx-text)]">Registro semanal</strong>
              <span className="text-sm">La IA entrega un CSV con fecha para cada tarea.</span>
            </button>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="tbx-label mb-0">1. Prompt para la IA</label>
              <button className="tbx-button-secondary" type="button" onClick={() => copy(prompt, "prompt")}>
                {copied === "prompt" ? <Check size={16} /> : <Clipboard size={16} />} {copied === "prompt" ? "Copiado" : "Copiar prompt"}
              </button>
            </div>
            <textarea className="tbx-input min-h-52 font-mono text-xs" readOnly value={prompt} />
            <p className="tbx-help">Puedes usar este prompt en cualquier asistente. La aplicación no envía información automáticamente a servicios externos.</p>
          </div>

          <div className="tbx-panel p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 shrink-0 text-[var(--tbx-support)]" size={20} />
              <div>
                <strong className="text-[var(--tbx-text)]">Flujo sugerido</strong>
                <p className="mt-1 text-sm">Pega el prompt en la IA, responde sus preguntas, confirma el resumen y copia solamente el bloque final que te entregue.</p>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="tbx-label mb-0">2. Resultado entregado por la IA</label>
              <button className="tbx-button-secondary" type="button" disabled={!response.trim()} onClick={() => copy(response, "response")}>
                {copied === "response" ? <Check size={16} /> : <Clipboard size={16} />} {copied === "response" ? "Copiado" : "Copiar resultado"}
              </button>
            </div>
            <textarea
              className="tbx-input min-h-36 font-mono text-sm"
              value={response}
              onChange={(event) => setResponse(event.target.value)}
              placeholder={period === "daily" ? "1,25 | Alertas DT | Revisión y ajustes..." : "fecha,cliente,tarea,hh,estado,origen,ticket,comentarios\n2026-07-21,..."}
            />
            <p className="tbx-help">En carga rápida usa Texto rápido para el registro diario y CSV para el registro semanal.</p>
          </div>
        </div>

        <footer className="tbx-modal-footer">
          <button className="tbx-button-ghost" type="button" onClick={onClose}>Cancelar</button>
          <button className="tbx-button-secondary" type="button" onClick={() => window.open("https://chatgpt.com", "_blank", "noopener,noreferrer")}><ExternalLink size={16} /> Abrir ChatGPT</button>
          <button className="tbx-button-primary" type="button" onClick={copyAndOpenBatch} disabled={!response.trim()}><Bot size={17} /> Copiar y abrir carga rápida</button>
        </footer>
      </section>
    </div>
  );
}
