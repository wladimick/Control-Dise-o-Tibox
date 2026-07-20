import { PageHeader } from "@/components/page-header";
import { WorkItemForm } from "@/components/work-items/work-item-form";
import { getTeamMembers } from "@/lib/data";

export default async function NewWorkItemPage() {
  const team = await getTeamMembers("Diseño");
  return (
    <>
      <PageHeader eyebrow="Nuevo registro" title="Agregar trabajo" description="Puede comenzar como tarea pendiente y decidirse después si se consolida en el reporte." />
      <WorkItemForm teamMembers={team} />
    </>
  );
}
