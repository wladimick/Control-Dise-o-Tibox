import { getCurrentContext } from "@/lib/auth";
import type { Assignment, TeamMember, WorkItem } from "@/lib/types";

const workItemSelect = `
  *,
  assignments:work_item_assignments(
    id,
    percentage,
    team_member:team_members(
      id, full_name, short_name, area, role_title, email, active, sort_order
    )
  )
`;

type RawAssignment = Omit<Assignment, "percentage" | "team_member"> & {
  percentage: number | string;
  team_member: TeamMember | TeamMember[] | null;
};

type RawWorkItem = Omit<WorkItem, "duration_weeks" | "hh_total" | "hh_weekly" | "assignments"> & {
  duration_weeks: number | string | null;
  hh_total: number | string | null;
  hh_weekly: number | string | null;
  assignments: RawAssignment[] | null;
};

function normalizeAssignment(assignment: RawAssignment): Assignment | null {
  const teamMember = Array.isArray(assignment.team_member)
    ? assignment.team_member[0]
    : assignment.team_member;
  if (!teamMember) return null;
  return {
    id: assignment.id,
    percentage: Number(assignment.percentage),
    team_member: teamMember,
  };
}

function normalizeWorkItem(item: RawWorkItem): WorkItem {
  const assignments = (item.assignments ?? [])
    .map(normalizeAssignment)
    .filter((assignment): assignment is Assignment => Boolean(assignment))
    .sort((a, b) => a.team_member.sort_order - b.team_member.sort_order);

  return {
    ...item,
    duration_weeks: Number(item.duration_weeks ?? 0),
    hh_total: Number(item.hh_total ?? 0),
    hh_weekly: Number(item.hh_weekly ?? 0),
    assignments,
  };
}

export async function getWorkItems(options?: { reportOnly?: boolean; limit?: number }) {
  const { supabase } = await getCurrentContext();
  let query = supabase
    .from("work_items")
    .select(workItemSelect)
    .order("updated_at", { ascending: false });

  if (options?.reportOnly) query = query.eq("report_to_cesar", true);
  if (options?.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as RawWorkItem[]).map(normalizeWorkItem);
}

export async function getWorkItem(id: string) {
  const { supabase } = await getCurrentContext();
  const { data, error } = await supabase
    .from("work_items")
    .select(workItemSelect)
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return normalizeWorkItem(data as unknown as RawWorkItem);
}

export async function getTeamMembers(area?: string) {
  const { supabase } = await getCurrentContext();
  let query = supabase
    .from("team_members")
    .select("id,full_name,short_name,area,role_title,email,active,sort_order")
    .eq("active", true)
    .order("sort_order");
  if (area) query = query.eq("area", area);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as TeamMember[];
}
