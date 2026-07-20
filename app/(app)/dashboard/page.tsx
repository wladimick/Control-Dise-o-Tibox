import Link from "next/link";
import { ArrowRight, Clock3, FileCheck2, Inbox, ListChecks, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { getCurrentContext } from "@/lib/auth";
import { SIZE_LABELS, STATUS_LABELS, TYPE_LABELS } from "@/lib/constants";
import { getWorkItems } from "@/lib/data";
import { formatDateTime, formatHours } from "@/lib/utils";

export default async function DashboardPage() {
  const [{ profile }, items] = await Promise.all([getCurrentContext(), getWorkItems()]);
  const active = items.filter((item) => ["inbox", "planned", "in_progress", "blocked"].includes(item.status));
  const pending = active.filter((item) => item.size === "pending");
  const reportable = active.filter((item) => item.report_to_cesar);
  const totalHours = active.reduce((sum, item) => sum + item.hh_total, 0);
  const people = new Set(active.flatMap((item) => item.assignments.map((a) => a.team_member.short_name))).size;

  const cards = [
    { label: "Trabajo activo", value: active.length, icon: ListChecks },
    { label: "Por clasificar", value: pending.length, icon: Inbox },
    { label: "Reporte César", value: reportable.length, icon: FileCheck2 },
    { label: "HH activas", value: formatHours(totalHours), icon: Clock3 },
    { label: "Personas asignadas", value: people, icon: Users },
  ];

  return (
    <>
      <PageHeader eyebrow="Resumen operativo" title={`Hola, ${profile.full_name?.split(" ")[0] || "equipo"}`} description="Revisa lo pendiente, consolida las tareas grandes y mantén preparado el reporte de César." />
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, value, icon: Icon }) => (
          <article key={label} className="tbx-card p-5">
            <Icon size={19} className="text-[var(--tbx-support)]" />
            <p className="mt-5 text-3xl font-bold text-[var(--tbx-text)]">{value}</p>
            <p className="mt-1 text-sm text-[var(--tbx-text-muted)]">{label}</p>
          </article>
        ))}
      </section>

      <section className="mt-7 grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <div className="tbx-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--tbx-border)] p-5">
            <div><h2 className="text-xl font-bold text-[var(--tbx-text)]">Actualizaciones recientes</h2><p className="text-sm">Últimos registros modificados.</p></div>
            <Link href="/trabajo" className="tbx-button-ghost">Ver todo <ArrowRight size={16} /></Link>
          </div>
          <div className="divide-y divide-[var(--tbx-border)]">
            {items.slice(0, 7).map((item) => (
              <Link href={`/trabajo/${item.id}/editar`} key={item.id} className="flex items-start justify-between gap-4 p-4 hover:bg-[var(--tbx-surface-2)]">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[var(--tbx-text)]">{item.client_name} · {item.title}</p>
                  <div className="mt-2 flex flex-wrap gap-2"><Badge tone="blue">{TYPE_LABELS[item.type]}</Badge><Badge>{STATUS_LABELS[item.status]}</Badge></div>
                </div>
                <span className="tbx-mono shrink-0 text-[.68rem] text-[var(--tbx-text-subtle)]">{formatDateTime(item.updated_at)}</span>
              </Link>
            ))}
            {!items.length ? <p className="p-6 text-center">Aún no hay registros.</p> : null}
          </div>
        </div>

        <div className="tbx-card p-5">
          <h2 className="text-xl font-bold text-[var(--tbx-text)]">Pendientes de decisión</h2>
          <p className="mt-1 text-sm">Tareas que todavía no están clasificadas como pequeñas o grandes.</p>
          <div className="mt-5 space-y-3">
            {pending.slice(0, 6).map((item) => (
              <Link key={item.id} href={`/trabajo/${item.id}/editar`} className="block rounded-xl border border-[var(--tbx-border)] p-4 hover:border-[var(--tbx-border-accent)]">
                <p className="font-semibold text-[var(--tbx-text)]">{item.title}</p>
                <p className="mt-1 text-sm">{item.client_name} · {formatHours(item.hh_total)} HH</p>
                <div className="mt-3"><Badge tone="amber">{SIZE_LABELS[item.size]}</Badge></div>
              </Link>
            ))}
            {!pending.length ? <p className="rounded-xl bg-[var(--tbx-surface-2)] p-4 text-sm">No hay tareas pendientes de clasificación.</p> : null}
          </div>
        </div>
      </section>
    </>
  );
}
