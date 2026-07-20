import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { WorkItemsTable } from "@/components/work-items/work-items-table";
import { getCurrentContext } from "@/lib/auth";
import { getWorkItems } from "@/lib/data";
import { canEdit } from "@/lib/utils";

export default async function WorkPage() {
  const [{ profile }, items] = await Promise.all([getCurrentContext(), getWorkItems()]);
  return (
    <>
      <PageHeader eyebrow="Bandeja operativa" title="Trabajo del equipo" description="Las tareas pueden mantenerse internas o consolidarse como requerimientos y proyectos para el Excel." actions={canEdit(profile.role) ? <Link href="/trabajo/nuevo" className="tbx-button-primary"><Plus size={17} /> Agregar</Link> : undefined} />
      <WorkItemsTable items={items} role={profile.role} />
    </>
  );
}
