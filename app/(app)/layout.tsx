import { AppShell } from "@/components/app-shell";
import { getCurrentContext } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getCurrentContext();
  return <AppShell profile={profile}>{children}</AppShell>;
}
