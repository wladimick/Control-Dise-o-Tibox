import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SharePoint Audit · TIBOX",
  description: "Inventario y auditoría de solo lectura para sitios Microsoft SharePoint.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
