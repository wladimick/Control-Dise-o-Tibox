import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Control Diseño TI · TIBOX",
  description: "Gestión liviana de tareas, requerimientos y reporte para César.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" data-tbx-theme="light">
      <body>{children}</body>
    </html>
  );
}
