"use client";

import { useActionState, useEffect } from "react";
import { Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveOperationalTask } from "@/app/(app)/trabajo/operations-actions";
import { PRIORITY_LABELS, SOURCE_LABELS, STATUS_LABELS, TYPE_LABELS } from "@/lib/constants";
import type { AppRole, TeamMember, WorkItem } from "@/lib/types";
import { canEdit } from "@/lib/utils";
import { PersonAvatar } from "@/components/ui/person-avatar";

export function OperationsTaskModal({ item, teamMembers, role, onClose }: { item?: WorkItem; teamMembers: TeamMember[]; role: AppRole; onClose: () => void }) {
  const router = useRouter();
  const editable = canEdit(role);
  const [state, action, pending] = useActionState(saveOperationalTask, {});
  const assignmentMap = new Map(item?.assignments.map((assignment) => [assignment.team_member.id, Math.round(assignment.percentage * 100)]) ?? []);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape" && !pending) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKey); };
  }, [onClose, pending]);

  useEffect(() => {
    if (!state.ok) return;
    router.refresh();
    onClose();
  }, [state.ok, router, onClose]);

  return <div className="ops-drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !pending) onClose(); }}>
    <aside className="ops-drawer" role="dialog" aria-modal="true">
      <header className="ops-drawer-header">
        <div><span>{item?.code ?? "Nueva tarea"}</span><h2>{item?.title ?? "Crear tarea"}</h2><p>{item?.client_name ?? "Registra lo esencial y completa los detalles cuando corresponda."}</p></div>
        <button type="button" onClick={onClose} aria-label="Cerrar"><X size={19} /></button>
      </header>
      <form action={action} className="ops-drawer-form">
        <input type="hidden" name="id" value={item?.id ?? ""} />
        <input type="hidden" name="code" value={item?.code ?? ""} />
        <input type="hidden" name="size" value={item?.size ?? "pending"} />
        <input type="hidden" name="duration_weeks" value={item?.duration_weeks ?? 1} />
        <input type="hidden" name="category" value={item?.category ?? "external"} />
        <input type="hidden" name="parent_work_item_id" value={item?.parent_work_item_id ?? ""} />

        <div className="ops-drawer-body">
          <section className="ops-form-section">
            <h3>Información</h3>
            <div className="ops-form-grid two">
              <label><span>Cliente</span><input name="client_name" defaultValue={item?.client_name ?? ""} required disabled={!editable} /></label>
              <label><span>Tarea</span><input name="title" defaultValue={item?.title ?? ""} required disabled={!editable} /></label>
            </div>
            <label><span>Descripción</span><textarea name="description" defaultValue={item?.description ?? ""} disabled={!editable} /></label>
          </section>

          <section className="ops-form-section">
            <h3>Planificación</h3>
            <div className="ops-form-grid three">
              <label><span>Estado</span><select name="status" defaultValue={item?.status ?? "planned"} disabled={!editable}>{Object.entries(STATUS_LABELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label><span>Prioridad</span><select name="priority" defaultValue={item?.priority ?? "medium"} disabled={!editable}>{Object.entries(PRIORITY_LABELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label><span>Tipo</span><select name="type" defaultValue={item?.type ?? "task"} disabled={!editable}>{Object.entries(TYPE_LABELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label><span>Inicio</span><input name="start_date" type="date" defaultValue={item?.start_date ?? ""} disabled={!editable} /></label>
              <label><span>Fecha límite</span><input name="due_date" type="date" defaultValue={item?.due_date ?? item?.end_date ?? ""} disabled={!editable} /></label>
              <label><span>HH estimadas</span><input name="hh_total" type="number" min="0" step="0.25" defaultValue={item?.hh_total ?? 0} disabled={!editable} /></label>
            </div>
          </section>

          <section className="ops-form-section">
            <h3>Responsables</h3>
            <div className="ops-assignees">{teamMembers.map((member) => <label key={member.id} className="ops-assignee"><input type="hidden" name="assignment_member_id" value={member.id} /><PersonAvatar member={member} /><span><strong>{member.full_name}</strong><small>{member.role_title || member.area}</small></span><div><input name={`assignment_${member.id}`} type="number" min="0" max="100" step="1" defaultValue={assignmentMap.get(member.id) ?? 0} disabled={!editable} /><em>%</em></div></label>)}</div>
          </section>

          <section className="ops-form-section">
            <h3>Origen</h3>
            <div className="ops-form-grid three">
              <label><span>Origen</span><select name="source" defaultValue={item?.source ?? "manual"} disabled={!editable}>{Object.entries(SOURCE_LABELS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label><span>Ticket / ID</span><input name="source_reference" defaultValue={item?.source_reference ?? ""} disabled={!editable} /></label>
              <label><span>URL origen</span><input name="source_url" type="url" defaultValue={item?.source_url ?? ""} disabled={!editable} /></label>
            </div>
          </section>

          <section className="ops-form-section">
            <h3>Redes sociales <small>opcional</small></h3>
            <div className="ops-form-grid three">
              <label><span>Canal</span><select name="channel" defaultValue={item?.channel ?? ""} disabled={!editable}><option value="">No aplica</option><option>Instagram</option><option>LinkedIn</option><option>Facebook</option><option>YouTube</option><option>TikTok</option></select></label>
              <label><span>Formato</span><select name="content_type" defaultValue={item?.content_type ?? ""} disabled={!editable}><option value="">No aplica</option><option>Post</option><option>Carrusel</option><option>Story</option><option>Reel</option><option>Video</option></select></label>
              <label><span>Publicación</span><input name="publish_date" type="date" defaultValue={item?.publish_date ?? ""} disabled={!editable} /></label>
            </div>
          </section>

          <section className="ops-form-section">
            <h3>Control</h3>
            <label className="ops-checkbox"><input type="checkbox" name="report_to_cesar" defaultChecked={item?.report_to_cesar ?? false} disabled={!editable} /><span><strong>Incluir en reporte</strong><small>Se mantiene compatible con el consolidado actual.</small></span></label>
            <label><span>Comentarios</span><textarea name="comments" defaultValue={item?.comments ?? ""} disabled={!editable} /></label>
          </section>
          {state.error ? <p className="ops-form-error">{state.error}</p> : null}
        </div>
        <footer className="ops-drawer-footer"><button type="button" onClick={onClose} disabled={pending}>Cancelar</button>{editable ? <button className="tbx-button-primary" type="submit" disabled={pending}><Save size={16} /> {pending ? "Guardando…" : item ? "Guardar cambios" : "Crear tarea"}</button> : null}</footer>
      </form>
    </aside>
  </div>;
}
