import { Download } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { WorkItemsTable } from "@/components/work-items/work-items-table";
import { getCurrentContext } from "@/lib/auth";
import { getWorkItems } from "@/lib/data";

export default async function ReportPage() {
  const [{ profile }, items] = await Promise.all([getCurrentContext(), getWorkItems({ reportOnly: true })]);
  return (
    <>
      <PageHeader eyebrow="Consolidación" title="Reporte para César" description="Solo aparecen los elementos marcados explícitamente para el reporte. Las HH corresponden a Diseño TI." actions={<a className="tbx-button-primary" href="/api/export"><Download size={17} /> Descargar Excel</a>} />
      <WorkItemsTable items={items} role={profile.role} reportMode />
    </>
  );
}
