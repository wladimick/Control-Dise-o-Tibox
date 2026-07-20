import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { WorkItemForm } from "@/components/work-items/work-item-form";
import { getTeamMembers, getWorkItem } from "@/lib/data";

export default async function EditWorkItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await getWorkItem(id).catch(() => null);
  if (!item) notFound();
  const team = await getTeamMembers("Diseño");

  return (
    <>
      <PageHeader eyebrow={item.code} title="Editar registro" description={`${item.client_name} · ${item.title}`} />
      <WorkItemForm item={item} teamMembers={team} />
    </>
  );
}
