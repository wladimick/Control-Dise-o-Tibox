"use client";

import { useCallback, useState } from "react";
import { Download, Plus, Upload } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ImportWorkItemsModal } from "@/components/work-items/import-work-items-modal";
import { WorkItemModal } from "@/components/work-items/work-item-modal";
import { WorkItemsTable } from "@/components/work-items/work-items-table";
import type { AppRole, TeamMember, WorkItem } from "@/lib/types";
import { canEdit } from "@/lib/utils";

type ModalState =
  | { type: "new" }
  | { type: "edit"; item: WorkItem }
  | { type: "import" }
  | null;

export function WorkItemsWorkspace({
  items,
  teamMembers,
  role,
  reportMode = false,
}: {
  items: WorkItem[];
  teamMembers: TeamMember[];
  role: AppRole;
  reportMode?: boolean;
}) {
  const [modal, setModal] = useState<ModalState>(null);
  const closeModal = useCallback(() => setModal(null), []);

  const actions = reportMode ? (
    <a className="tbx-button-primary" href="/api/export"><Download size={17} /> Descargar Excel</a>
  ) : canEdit(role) ? (
    <>
      <button className="tbx-button-secondary" type="button" onClick={() => setModal({ type: "import" })}><Upload size={17} /> Importar</button>
      <button className="tbx-button-primary" type="button" onClick={() => setModal({ type: "new" })}><Plus size={17} /> Agregar</button>
    </>
  ) : undefined;

  return (
    <>
      <PageHeader
        eyebrow={reportMode ? "Consolidación" : "Bandeja operativa"}
        title={reportMode ? "Reporte para César" : "Trabajo del equipo"}
        description={reportMode ? "Solo aparecen los elementos marcados explícitamente para el reporte. Las HH corresponden a Diseño TI." : "Haz clic en una fila para revisar o editar lo esencial. Las tareas pueden mantenerse internas o consolidarse para el Excel."}
        actions={actions}
      />
      <WorkItemsTable items={items} role={role} reportMode={reportMode} onOpenItem={(item) => setModal({ type: "edit", item })} />

      {modal?.type === "new" ? <WorkItemModal key="new" teamMembers={teamMembers} role={role} onClose={closeModal} /> : null}
      {modal?.type === "edit" ? <WorkItemModal key={modal.item.id} item={modal.item} teamMembers={teamMembers} role={role} onClose={closeModal} /> : null}
      {modal?.type === "import" ? <ImportWorkItemsModal key="import" onClose={closeModal} /> : null}
    </>
  );
}
