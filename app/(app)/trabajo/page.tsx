import { WorkItemsWorkspace } from "@/components/work-items/work-items-workspace";
import { getCurrentContext } from "@/lib/auth";
import { getTeamMembers, getWorkItems } from "@/lib/data";

export default async function WorkPage() {
  const [{ profile }, items, team] = await Promise.all([
    getCurrentContext(),
    getWorkItems(),
    getTeamMembers("Diseño"),
  ]);
  return <WorkItemsWorkspace items={items} teamMembers={team} role={profile.role} />;
}
