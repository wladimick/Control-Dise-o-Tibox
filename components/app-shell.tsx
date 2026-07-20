import Link from "next/link";
import { BarChart3, ClipboardList, FileSpreadsheet, LogOut, Plus } from "lucide-react";
import { TiboxLogo } from "@/components/brand/tibox-logo";
import { signOutAction } from "@/app/(app)/actions";
import type { Profile } from "@/lib/types";
import { canEdit } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/trabajo", label: "Trabajo", icon: ClipboardList },
  { href: "/reporte", label: "Reporte César", icon: FileSpreadsheet },
];

export function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--tbx-bg)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-[var(--tbx-border)] bg-[var(--tbx-surface)] lg:flex lg:flex-col">
        <div className="flex h-20 items-center border-b border-[var(--tbx-border)] px-6"><TiboxLogo /></div>
        <nav className="flex-1 space-y-1 p-4">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 font-semibold text-[var(--tbx-text-muted)] hover:bg-[var(--tbx-surface-2)] hover:text-[var(--tbx-text)]">
              <Icon size={18} /> {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-[var(--tbx-border)] p-4">
          <div className="mb-3 px-2">
            <p className="font-semibold text-[var(--tbx-text)]">{profile.full_name || profile.email}</p>
            <p className="tbx-mono mt-1 text-[.65rem] uppercase tracking-[.12em] text-[var(--tbx-text-subtle)]">{profile.role}</p>
          </div>
          <form action={signOutAction}><button className="tbx-button-ghost w-full justify-start" type="submit"><LogOut size={17} /> Cerrar sesión</button></form>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--tbx-border)] bg-[color:var(--tbx-bg)]/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="lg:hidden"><TiboxLogo compact className="h-9 w-9" /></div>
          <div className="ml-auto flex items-center gap-3">
            {canEdit(profile.role) ? <Link href="/trabajo/nuevo" className="tbx-button-primary"><Plus size={17} /> Nuevo</Link> : null}
          </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-[var(--tbx-border)] bg-[var(--tbx-surface)] lg:hidden">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 px-2 py-2 text-xs font-semibold text-[var(--tbx-text-muted)]"><Icon size={18} />{label}</Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
