import type {
  WorkCategory,
  WorkItemSize,
  WorkItemSource,
  WorkItemStatus,
  WorkItemType,
  DailyTaskStatus,
} from "@/lib/types";

export const TYPE_LABELS: Record<WorkItemType, string> = {
  task: "Tarea",
  requirement: "Requerimiento",
  project: "Proyecto",
  prospect: "Prospecto",
  support: "Soporte",
};

export const SIZE_LABELS: Record<WorkItemSize, string> = {
  pending: "Pendiente",
  small: "Pequeña",
  large: "Grande",
};

export const STATUS_LABELS: Record<WorkItemStatus, string> = {
  inbox: "Bandeja",
  planned: "Planificado",
  in_progress: "En curso",
  blocked: "Bloqueado",
  completed: "Terminado",
  archived: "Archivado",
  discarded: "Descartado",
};

export const SOURCE_LABELS: Record<WorkItemSource, string> = {
  manual: "Manual",
  support: "soporte.tibox.cl",
  projects: "projects.tibox.cl",
  email: "Correo",
  commercial: "Comercial",
  other: "Otro",
};

export const CATEGORY_LABELS: Record<WorkCategory, string> = {
  external: "Externo",
  internal: "Interno",
};

export const AREA_OPTIONS = ["Diseño", "Analítica", "Desarrollo", "Consultoría", "Subgerencia"];

export const DAILY_STATUS_LABELS: Record<DailyTaskStatus, string> = {
  pending: "Pendiente",
  done: "Realizada",
  blocked: "Bloqueada",
};
