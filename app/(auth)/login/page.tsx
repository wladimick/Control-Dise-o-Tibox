import { LoginForm } from "@/components/auth/login-form";
import { TiboxLogo } from "@/components/brand/tibox-logo";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_.9fr]">
      <section className="relative hidden overflow-hidden bg-[var(--tbx-bg)] p-12 text-white lg:flex lg:flex-col lg:justify-between" data-tbx-theme="dark">
        <TiboxLogo />
        <div className="relative z-10 max-w-xl">
          <span className="tbx-mono text-xs uppercase tracking-[.18em] text-[var(--tbx-support)]">Diseño TI · Operación</span>
          <h1 className="mt-6 text-5xl font-bold leading-[1.05] text-[var(--tbx-text)]">
            Menos Excel manual. Más claridad del trabajo activo.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-[var(--tbx-text-muted)]">
            Registra tareas pequeñas, consolida requerimientos y decide qué se incorpora al reporte de César.
          </p>
        </div>
        <div className="absolute -right-32 top-20 h-[520px] w-[520px] rounded-full bg-[color:var(--tbx-support)]/10 blur-3xl" />
        <p className="tbx-mono text-xs uppercase tracking-[.12em] text-[var(--tbx-text-subtle)]">Uso interno TIBOX</p>
      </section>
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><TiboxLogo /></div>
          <span className="tbx-mono text-xs uppercase tracking-[.16em] text-[var(--tbx-support)]">Control Diseño TI</span>
          <h2 className="mt-3 text-3xl font-bold text-[var(--tbx-text)]">Bienvenido</h2>
          <p className="mb-8 mt-2 text-[var(--tbx-text-muted)]">Acceso para Wladimick, Braulio y usuarios autorizados.</p>
          <div className="tbx-card p-6"><LoginForm /></div>
        </div>
      </section>
    </main>
  );
}
