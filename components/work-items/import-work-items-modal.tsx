"use client";

import { useActionState, useEffect, useState } from "react";
import { FileSpreadsheet, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { importWorkItemsAction } from "@/app/(app)/trabajo/actions";

export function ImportWorkItemsModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [state, action, pending] = useActionState(importWorkItemsAction, {});

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
    if (state.ok) router.refresh();
  }, [state.ok, router]);

  return (
    <div className="tbx-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onClose(); }}>
      <section className="tbx-modal max-w-2xl" role="dialog" aria-modal="true" aria-labelledby="import-modal-title">
        <header className="tbx-modal-header">
          <div><span className="tbx-mono text-[.68rem] uppercase tracking-[.16em] text-[var(--tbx-support)]">Carga masiva</span><h2 id="import-modal-title" className="mt-1 text-2xl font-bold text-[var(--tbx-text)]">Importar elementos</h2><p className="mt-1 text-sm">Carga el Excel de César u otro archivo con encabezados equivalentes.</p></div>
          <button className="tbx-icon-button" type="button" onClick={onClose} aria-label="Cerrar" disabled={pending}><X size={19} /></button>
        </header>

        <form action={action} className="flex min-h-0 flex-1 flex-col">
          <div className="tbx-modal-body space-y-5">
            <label className="tbx-upload-zone">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--tbx-surface-2)] text-[var(--tbx-support)]"><FileSpreadsheet size={24} /></span>
              <span className="min-w-0 flex-1"><strong className="block truncate text-[var(--tbx-text)]">{fileName || "Seleccionar archivo"}</strong><span className="text-sm">Formatos .xlsx, .xlsm o .csv · máximo 8 MB</span></span>
              <input className="sr-only" type="file" name="file" accept=".xlsx,.xlsm,.csv" required onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")} />
            </label>

            <div className="tbx-panel p-4">
              <p className="font-semibold text-[var(--tbx-text)]">Columnas reconocidas automáticamente</p>
              <p className="mt-1 text-sm">Cliente, Proyecto/Trabajo, Tipo, Estado, Fecha Inicio, Fecha Término, Duración, HH Sem., HH Total, Wladimick, Braulio y Comentarios.</p>
              <p className="mt-2 text-xs">La aplicación busca los encabezados en las primeras 15 filas, por lo que funciona con el Excel actual aunque la tabla comience en la fila 2. Los duplicados por cliente, trabajo y fecha de inicio se omiten.</p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--tbx-border)] p-4">
              <input className="mt-1" type="checkbox" name="report_to_cesar" defaultChecked />
              <span><strong className="block text-[var(--tbx-text)]">Importar como reportables</strong><span className="text-sm">Actívalo para elementos provenientes del consolidado de César. Puedes cambiarlo después en cada registro.</span></span>
            </label>

            {state.error ? <p className="rounded-xl border border-[color:var(--tbx-danger)]/30 bg-[color:var(--tbx-danger)]/5 p-3 text-sm text-[var(--tbx-danger)]">{state.error}</p> : null}
            {state.ok ? <p className="rounded-xl border border-[color:var(--tbx-success)]/30 bg-[color:var(--tbx-success)]/5 p-3 text-sm font-semibold text-[var(--tbx-success)]">{state.message}</p> : null}
          </div>

          <footer className="tbx-modal-footer">
            <button className="tbx-button-ghost" type="button" onClick={onClose} disabled={pending}>{state.ok ? "Cerrar" : "Cancelar"}</button>
            {!state.ok ? <button className="tbx-button-primary min-w-36" type="submit" disabled={pending}><Upload size={17} />{pending ? "Importando…" : "Importar"}</button> : null}
          </footer>
        </form>
      </section>
    </div>
  );
}
