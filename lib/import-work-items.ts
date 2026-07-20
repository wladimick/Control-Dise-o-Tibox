import ExcelJS from "exceljs";
import type {
  WorkCategory,
  WorkItemSize,
  WorkItemSource,
  WorkItemStatus,
  WorkItemType,
} from "@/lib/types";

export type ImportedAssignment = {
  shortName: string;
  percentage: number;
};

export type ImportedWorkItem = {
  client_name: string;
  title: string;
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
  comments: string | null;
  assignments: ImportedAssignment[];
};

type CanonicalHeader =
  | "client"
  | "title"
  | "type"
  | "size"
  | "status"
  | "source"
  | "source_reference"
  | "source_url"
  | "area"
  | "category"
  | "start_date"
  | "end_date"
  | "duration_weeks"
  | "hh_weekly"
  | "hh_total"
  | "comments"
  | "wladimick"
  | "braulio";

const HEADER_ALIASES: Record<CanonicalHeader, string[]> = {
  client: ["cliente", "client"],
  title: ["proyecto", "trabajo", "titulo", "título", "requerimiento", "project"],
  type: ["tipo", "type"],
  size: ["tamano", "tamaño", "size"],
  status: ["estado", "status"],
  source: ["origen", "source"],
  source_reference: ["ticket", "id externo", "referencia", "ticket / id externo"],
  source_url: ["url", "enlace", "link"],
  area: ["area principal", "área principal", "area", "área"],
  category: ["categoria", "categoría", "category"],
  start_date: ["fecha inicio", "inicio", "start date"],
  end_date: ["fecha termino", "fecha término", "termino", "término", "end date"],
  duration_weeks: ["dur. (sem)", "dur sem", "duracion", "duración", "semanas"],
  hh_weekly: ["hh sem.", "hh sem", "hh semanal", "hh semanales"],
  hh_total: ["hh total", "hh totales", "horas totales"],
  comments: ["comentarios", "comentario", "observaciones"],
  wladimick: ["wladimick", "wladi"],
  braulio: ["braulio"],
};

function normalizeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\n\r]+/g, " ")
    .replace(/[^a-z0-9%./() -]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cellValue(cell: ExcelJS.Cell): unknown {
  const value = cell.value;
  if (value == null) return "";
  if (value instanceof Date) return value;
  if (typeof value === "object") {
    if ("result" in value && value.result != null) return value.result;
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("");
    }
    if ("hyperlink" in value && "text" in value) return value.text;
  }
  return value;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function aliasFor(value: unknown): CanonicalHeader | null {
  const normalized = normalizeText(value);
  for (const [key, aliases] of Object.entries(HEADER_ALIASES) as Array<[CanonicalHeader, string[]]>) {
    if (aliases.some((alias) => normalizeText(alias) === normalized)) return key;
  }
  return null;
}

function findHeader(rows: unknown[][]) {
  let best: { rowIndex: number; columns: Map<CanonicalHeader, number>; score: number } | undefined;
  const limit = Math.min(rows.length, 15);
  for (let rowIndex = 0; rowIndex < limit; rowIndex += 1) {
    const row = rows[rowIndex];
    const columns = new Map<CanonicalHeader, number>();
    row.forEach((value, columnIndex) => {
      const alias = aliasFor(value);
      if (alias && !columns.has(alias)) columns.set(alias, columnIndex);
    });
    const score = columns.size + (columns.has("client") ? 3 : 0) + (columns.has("title") ? 3 : 0);
    if (!best || score > best.score) best = { rowIndex, columns, score };
  }
  if (!best || best.score < 7 || !best.columns.has("client") || !best.columns.has("title")) {
    throw new Error("No encontré una fila de encabezados con Cliente y Proyecto/Trabajo.");
  }
  return best;
}

function rawAt(row: unknown[], columns: Map<CanonicalHeader, number>, key: CanonicalHeader) {
  const index = columns.get(key);
  return index == null ? "" : row[index];
}

function numberValue(value: unknown, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  let normalized = String(value ?? "").replace(/%/g, "").replace(/\s/g, "").trim();
  if (normalized.includes(",") && normalized.includes(".")) normalized = normalized.replace(/\./g, "").replace(",", ".");
  else if (normalized.includes(",")) normalized = normalized.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function percentageValue(value: unknown) {
  if (typeof value === "number") {
    if (value > 0 && value <= 1) return value * 100;
    return value;
  }
  return numberValue(value, 0);
}

function dateValue(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    epoch.setUTCDate(epoch.getUTCDate() + value);
    return epoch.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  if (!text) return null;
  const iso = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (iso) return `${iso[1]}-${iso[2].padStart(2, "0")}-${iso[3].padStart(2, "0")}`;
  const latam = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (latam) {
    const year = latam[3].length === 2 ? `20${latam[3]}` : latam[3];
    return `${year}-${latam[2].padStart(2, "0")}-${latam[1].padStart(2, "0")}`;
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function typeValue(value: unknown): WorkItemType {
  const text = normalizeText(value);
  if (text.includes("prospect")) return "prospect";
  if (text.includes("proyect")) return "project";
  if (text.includes("requer")) return "requirement";
  if (text.includes("soporte") || text.includes("ticket")) return "support";
  return "task";
}

function sizeValue(value: unknown, type: WorkItemType): WorkItemSize {
  const text = normalizeText(value);
  if (text.includes("pend")) return "pending";
  if (text.includes("pequ") || text.includes("small")) return "small";
  if (text.includes("grand") || text.includes("large")) return "large";
  return type === "task" || type === "support" ? "small" : "large";
}

function statusValue(value: unknown): WorkItemStatus {
  const text = normalizeText(value);
  if (text.includes("bloq")) return "blocked";
  if (text.includes("termin") || text.includes("complet") || text.includes("cerrad")) return "completed";
  if (text.includes("archiv")) return "archived";
  if (text.includes("descart")) return "discarded";
  if (text.includes("curso") || text.includes("progreso")) return "in_progress";
  if (text.includes("plan")) return "planned";
  return "inbox";
}

function sourceValue(value: unknown): WorkItemSource {
  const text = normalizeText(value);
  if (text.includes("soporte")) return "support";
  if (text.includes("project")) return "projects";
  if (text.includes("correo") || text.includes("email")) return "email";
  if (text.includes("comercial")) return "commercial";
  if (text && !text.includes("manual")) return "other";
  return "manual";
}

function categoryValue(value: unknown): WorkCategory {
  return normalizeText(value).includes("intern") ? "internal" : "external";
}

function weeksBetween(start: string | null, end: string | null) {
  if (!start || !end) return 1;
  const startMs = new Date(`${start}T00:00:00Z`).getTime();
  const endMs = new Date(`${end}T00:00:00Z`).getTime();
  if (endMs < startMs) return 1;
  return Math.max(1, Math.ceil(((endMs - startMs) / 86400000 + 1) / 7));
}

function rowToItem(row: unknown[], columns: Map<CanonicalHeader, number>): ImportedWorkItem | null {
  const client = String(rawAt(row, columns, "client") ?? "").trim();
  const title = String(rawAt(row, columns, "title") ?? "").trim();
  if (!client || !title) return null;

  const type = typeValue(rawAt(row, columns, "type"));
  const startDate = dateValue(rawAt(row, columns, "start_date"));
  const endDate = dateValue(rawAt(row, columns, "end_date"));
  const duration = Math.max(1, numberValue(rawAt(row, columns, "duration_weeks"), weeksBetween(startDate, endDate)));
  const weekly = Math.max(0, numberValue(rawAt(row, columns, "hh_weekly"), 0));
  const totalCell = rawAt(row, columns, "hh_total");
  const total = Math.max(0, numberValue(totalCell, weekly * duration));

  const rawAssignments = [
    { shortName: "Wladimick", percentage: percentageValue(rawAt(row, columns, "wladimick")) },
    { shortName: "Braulio", percentage: percentageValue(rawAt(row, columns, "braulio")) },
  ].filter((assignment) => assignment.percentage > 0);
  const assignmentTotal = rawAssignments.reduce((sum, assignment) => sum + assignment.percentage, 0);
  const assignments = assignmentTotal > 0
    ? rawAssignments.map((assignment) => ({ ...assignment, percentage: assignment.percentage / assignmentTotal }))
    : [];

  return {
    client_name: client,
    title,
    type,
    size: sizeValue(rawAt(row, columns, "size"), type),
    status: statusValue(rawAt(row, columns, "status")),
    source: sourceValue(rawAt(row, columns, "source")),
    source_reference: String(rawAt(row, columns, "source_reference") ?? "").trim() || null,
    source_url: String(rawAt(row, columns, "source_url") ?? "").trim() || null,
    area: String(rawAt(row, columns, "area") ?? "").trim() || "Diseño",
    category: categoryValue(rawAt(row, columns, "category")),
    start_date: startDate,
    end_date: endDate,
    duration_weeks: duration,
    hh_total: total,
    comments: String(rawAt(row, columns, "comments") ?? "").trim() || null,
    assignments,
  };
}

export async function parseWorkItemsFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  let rows: unknown[][];

  if (extension === "csv") {
    rows = parseCsv(await file.text());
  } else if (extension === "xlsx" || extension === "xlsm") {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(await file.arrayBuffer()) as never);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) throw new Error("El archivo no contiene hojas.");
    rows = [];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
      const values: unknown[] = [];
      for (let column = 1; column <= row.cellCount; column += 1) {
        values[column - 1] = cellValue(row.getCell(column));
      }
      rows.push(values);
    });
  } else {
    throw new Error("Formato no compatible. Usa .xlsx, .xlsm o .csv.");
  }

  const { rowIndex, columns } = findHeader(rows);
  return rows.slice(rowIndex + 1).map((row) => rowToItem(row, columns)).filter((item): item is ImportedWorkItem => Boolean(item));
}
