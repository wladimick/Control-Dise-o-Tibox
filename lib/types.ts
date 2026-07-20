export type AppRole = "admin" | "editor" | "viewer";
export type WorkItemType = "task" | "requirement" | "project" | "prospect" | "support";
export type WorkItemSize = "pending" | "small" | "large";
export type WorkItemStatus =
  | "inbox"
  | "planned"
  | "in_progress"
  | "blocked"
  | "completed"
  | "archived"
  | "discarded";
export type WorkItemSource = "manual" | "support" | "projects" | "email" | "commercial" | "other";
export type WorkCategory = "external" | "internal";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
};

export type TeamMember = {
  id: string;
  full_name: string;
  short_name: string;
  area: string;
  role_title: string | null;
  email: string | null;
  active: boolean;
  sort_order: number;
};

export type Assignment = {
  id: string;
  percentage: number;
  team_member: TeamMember;
};

export type WorkItem = {
  id: string;
  code: string;
  client_name: string;
  title: string;
  description: string | null;
  type: WorkItemType;
  size: WorkItemSize;
  status: WorkItemStatus;
  source: WorkItemSource;
  source_reference: string | null;
  source_url: string | null;
  area: string;
  category: WorkCategory;
  start_date: string | null;
  end_date: string | null;
  duration_weeks: number;
  hh_total: number;
  hh_weekly: number;
  report_to_cesar: boolean;
  reported_at: string | null;
  comments: string | null;
  created_at: string;
  updated_at: string;
  assignments: Assignment[];
};

export type ActionState = {
  ok?: boolean;
  error?: string;
};
