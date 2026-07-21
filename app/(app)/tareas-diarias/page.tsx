import { DailyTasksWorkspace } from "@/components/daily-tasks/daily-tasks-workspace";
import { getCurrentContext } from "@/lib/auth";
import { getDailyTasks, getTeamMembers, getWorkItems } from "@/lib/data";

export default async function DailyTasksPage() {
  const [{ profile }, tasks, members, workItems] = await Promise.all([
    getCurrentContext(), getDailyTasks(), getTeamMembers("Diseño"), getWorkItems(),
  ]);
  return <DailyTasksWorkspace tasks={tasks} members={members} workItems={workItems} role={profile.role} />;
}
