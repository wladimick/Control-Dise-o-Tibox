import type { Metadata } from "next";
import "./globals.css";
import "./operations.css";
import "./drawer.css";

export const metadata: Metadata = {
  title: "Operación Diseño · TIBOX",
  description: "Gestión operativa del equipo de Diseño TIBOX.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-tbx-theme="light">
      <body>{children}</body>
    </html>
  );
}
