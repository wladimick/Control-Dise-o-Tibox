import { OperationsWorkspace } from "@/components/work-items/operations-workspace";
import { getCurrentContext } from "@/lib/auth";
import { getTeamMembers, getWorkItems } from "@/lib/data";

export default async function WorkPage() {
  const [{ profile }, items, teamMembers] = await Promise.all([
    getCurrentContext(),
    getWorkItems(),
    getTeamMembers("Diseño"),
  ]);

  return <OperationsWorkspace items={items} teamMembers={teamMembers} role={profile.role} />;
}
