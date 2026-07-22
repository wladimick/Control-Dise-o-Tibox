import { DashboardWorkspace } from "@/components/dashboard/dashboard-workspace";
import { getCurrentContext } from "@/lib/auth";
import { getDailyTasks, getTeamMembers, getWorkItems } from "@/lib/data";

export default async function DashboardPage() {
  const [{ profile }, items, tasks, members] = await Promise.all([
    getCurrentContext(),
    getWorkItems(),
    getDailyTasks(),
    getTeamMembers("Diseño"),
  ]);

  return <DashboardWorkspace profile={profile} items={items} tasks={tasks} members={members} role={profile.role} />;
}
