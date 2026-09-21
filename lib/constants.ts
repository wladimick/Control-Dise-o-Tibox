import type {
  WorkCategory,
  WorkItemSize,
  WorkItemSource,
  WorkItemStatus,
  WorkItemType,
  WorkPriority,
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
  planned: "Pendiente",
  in_progress: "En curso",
  in_review: "En revisión",
  blocked: "Bloqueada",
  completed: "Realizada",
  archived: "Archivada",
  discarded: "Descartada",
};

export const PRIORITY_LABELS: Record<WorkPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  urgent: "Urgente",
};

export const SOURCE_LABELS: Record<WorkItemSource, string> = {
  manual: "Interno",
  support: "Titrack",
  projects: "Projects",
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
