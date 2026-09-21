import Link from "next/link";
import { BarChart3, CalendarClock, ClipboardList, FileSpreadsheet, LogOut, Plus } from "lucide-react";
import { TiboxLogo } from "@/components/brand/tibox-logo";
import { signOutAction } from "@/app/(app)/actions";
import type { Profile } from "@/lib/types";
import { canEdit } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Inicio", icon: BarChart3 },
  { href: "/trabajo", label: "Mi trabajo", icon: ClipboardList },
  { href: "/tareas-diarias", label: "Bitácora", icon: CalendarClock },
  { href: "/reporte", label: "Reportes", icon: FileSpreadsheet },
];

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

export function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const displayName = profile.full_name || profile.email;
  return (
    <div className="min-h-screen bg-[var(--tbx-bg)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-[var(--tbx-border)] bg-[var(--tbx-surface)] lg:flex lg:flex-col">
        <div className="flex h-20 items-center border-b border-[var(--tbx-border)] px-6"><TiboxLogo /></div>
        <div className="px-4 pt-5"><p className="tbx-mono px-3 text-[.62rem] font-semibold uppercase tracking-[.13em] text-[var(--tbx-text-subtle)]">Operación Diseño</p></div>
        <nav className="flex-1 space-y-1 p-4 pt-3">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 font-semibold text-[var(--tbx-text-muted)] hover:bg-[var(--tbx-surface-2)] hover:text-[var(--tbx-text)]">
              <Icon size={18} /> {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-[var(--tbx-border)] p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl px-2 py-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#3559c7] text-xs font-bold text-white">{initials(displayName)}</span>
            <div className="min-w-0"><p className="truncate font-semibold text-[var(--tbx-text)]">{displayName}</p><p className="tbx-mono mt-0.5 text-[.6rem] uppercase tracking-[.1em] text-[var(--tbx-text-subtle)]">{profile.role === "admin" ? "Administrador" : profile.role}</p></div>
          </div>
          <form action={signOutAction}><button className="tbx-button-ghost w-full justify-start" type="submit"><LogOut size={17} /> Cerrar sesión</button></form>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--tbx-border)] bg-[color:var(--tbx-bg)]/92 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="lg:hidden"><TiboxLogo compact className="h-9 w-9" /></div>
          <div className="ml-auto flex items-center gap-3">
            {canEdit(profile.role) ? <Link href="/trabajo" className="tbx-button-primary"><Plus size={17} /> Nueva tarea</Link> : null}
          </div>
        </header>
        <main className="p-4 pb-24 sm:p-6 sm:pb-24 lg:p-7">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-[var(--tbx-border)] bg-[var(--tbx-surface)] lg:hidden">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 px-2 py-2 text-xs font-semibold text-[var(--tbx-text-muted)]"><Icon size={18} />{label}</Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
