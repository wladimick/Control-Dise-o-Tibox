"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { loginAction } from "@/app/(auth)/login/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, {});

  return (
    <form action={action} className="space-y-5">
      <div>
        <label className="tbx-label" htmlFor="email">Correo TIBOX</label>
        <input className="tbx-input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label className="tbx-label" htmlFor="password">Contraseña</label>
        <input className="tbx-input" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error ? (
        <p className="rounded-lg border border-[color:var(--tbx-danger)]/30 bg-[color:var(--tbx-danger)]/5 p-3 text-sm text-[var(--tbx-danger)]">
          {state.error}
        </p>
      ) : null}
      <button className="tbx-button-primary w-full" disabled={pending} type="submit">
        <LogIn size={17} /> {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
