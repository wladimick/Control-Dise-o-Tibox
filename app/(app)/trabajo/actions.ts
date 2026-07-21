"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import ExcelJS from "exceljs";
import { getCurrentContext } from "@/lib/auth";
import type { ActionState } from "@/lib/types";
import { canEdit, toNumber } from "@/lib/utils";

const schema = z.object({
  client_name: z.string().trim().min(2, "Ingresa el cliente."),
  title: z.string().trim().min(4, "Ingresa un título más descriptivo."),
  type: z.enum(["task", "requirement", "project", "prospect", "support"]),
  size: z.enum(["pending", "small", "large"]),
  status: z.enum(["inbox", "planned", "in_progress", "blocked", "completed", "archived", "discarded"]),
  source: z.enum(["manual", "support", "projects", "email", "commercial", "other"]),
  area: z.string().min(1),
  category: z.enum(["external", "internal"]),
});

function codePrefix(client: string) {
  const clean = client.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, "");
  return clean.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 3).toUpperCase().padEnd(3, "X");
}

async function buildCode(client: string, startDate: string | null) {
  const { supabase } = await getCurrentContext();
  const year = (startDate ? new Date(`${startDate}T00:00:00Z`).getUTCFullYear() : new Date().getFullYear()).toString().slice(-2);
  const prefix = `${codePrefix(client)}-${year}`;
  const { count } = await supabase.from("work_items").select("id", { count: "exact", head: true }).like("code", `${prefix}-%`);
  return `${prefix}-${String((count ?? 0) + 1).padStart(2, "0")}`;
}

async function saveAssignments(workItemId: string, formData: FormData) {
  const { supabase } = await getCurrentContext();
  const ids = formData.getAll("assignment_member_id").map(String);
  const rows = ids
    .map((id) => ({
      work_item_id: workItemId,
      team_member_id: id,
      percentage: toNumber(formData.get(`assignment_${id}`)) / 100,
    }))
    .filter((row) => row.percentage > 0);

  const total = rows.reduce((sum, row) => sum + row.percentage, 0);
  if (rows.length && Math.abs(total - 1) > 0.001) {
    throw new Error("Los porcentajes de asignación deben sumar 100 %.");
  }

  const { error: deleteError } = await supabase.from("work_item_assignments").delete().eq("work_item_id", workItemId);
  if (deleteError) throw deleteError;
  if (rows.length) {
    const { error } = await supabase.from("work_item_assignments").insert(rows);
    if (error) throw error;
  }
}

async function persistWorkItem(formData: FormData): Promise<ActionState> {
  const { profile, user, supabase } = await getCurrentContext();
  if (!canEdit(profile.role)) return { error: "Tu perfil es de solo lectura." };

  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa el formulario." };

  const id = String(formData.get("id") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "").trim() || null;
  const endDate = String(formData.get("end_date") ?? "").trim() || null;
  const reportToCesar = formData.get("report_to_cesar") === "on";
  const providedCode = String(formData.get("code") ?? "").trim();

  const payload = {
    ...parsed.data,
    code: providedCode || (id ? undefined : await buildCode(parsed.data.client_name, startDate)),
    description: String(formData.get("description") ?? "").trim() || null,
    source_reference: String(formData.get("source_reference") ?? "").trim() || null,
    source_url: String(formData.get("source_url") ?? "").trim() || null,
    start_date: startDate,
    end_date: endDate,
    duration_weeks: Math.max(1, toNumber(formData.get("duration_weeks"), 1)),
    hh_total: Math.max(0, toNumber(formData.get("hh_total"), 0)),
    report_to_cesar: reportToCesar,
    comments: String(formData.get("comments") ?? "").trim() || null,
    updated_by: user.id,
  };

  try {
    let workItemId = id;
    if (id) {
      const { error } = await supabase.from("work_items").update(payload).eq("id", id);
      if (error) throw error;
    } else {
      const { data, error } = await supabase.from("work_items").insert({ ...payload, created_by: user.id }).select("id").single();
      if (error) throw error;
      workItemId = data.id;
    }
    await saveAssignments(workItemId, formData);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No fue posible guardar." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/trabajo");
  revalidatePath("/reporte");
  return { ok: true, message: id ? "Registro actualizado." : "Registro creado." };
}

export async function saveWorkItemAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const result = await persistWorkItem(formData);
  if (result.error) return result;
  redirect("/trabajo");
}

export async function quickSaveWorkItemAction(_: ActionState, formData: FormData): Promise<ActionState> {
  return persistWorkItem(formData);
}

function normalizeHeader(value: unknown) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function excelDate(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number") {
    const date = new Date(Date.UTC(1899, 11, 30));
    date.setUTCDate(date.getUTCDate() + value);
    return date.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  const match = text.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (match) {
    const year = match[3].length === 2 ? `20${match[3]}` : match[3];
    return `${year}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  }
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

function numeric(value: unknown, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  const parsed = Number(String(value ?? "").replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function importWorkItemsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const { profile, user, supabase } = await getCurrentContext();
  if (!canEdit(profile.role)) return { error: "Tu perfil es de solo lectura." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Selecciona un archivo para importar." };
  if (file.size > 8 * 1024 * 1024) return { error: "El archivo supera el máximo de 8 MB." };

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(await file.arrayBuffer()) as never);
    const sheet = workbook.worksheets[0];
    if (!sheet) return { error: "El archivo no contiene hojas." };

    let headerRow = 0;
    const columns = new Map<string, number>();
    for (let r = 1; r <= Math.min(15, sheet.rowCount); r += 1) {
      const candidate = new Map<string, number>();
      sheet.getRow(r).eachCell((cell, col) => candidate.set(normalizeHeader(cell.text || cell.value), col));
      const keys = [...candidate.keys()];
      const hasClient = keys.some((key) => key === "cliente" || key === "client");
      const hasTitle = keys.some((key) => ["proyecto", "trabajo", "titulo", "requerimiento"].includes(key));
      if (hasClient && hasTitle) { headerRow = r; candidate.forEach((value, key) => columns.set(key, value)); break; }
    }
    if (!headerRow) return { error: "No encontré encabezados con Cliente y Proyecto/Trabajo." };

    const col = (...names: string[]) => {
      for (const name of names) { const found = columns.get(normalizeHeader(name)); if (found) return found; }
      return 0;
    };
    const clientCol = col("cliente", "client");
    const titleCol = col("proyecto", "trabajo", "titulo", "requerimiento");
    const startCol = col("fecha inicio", "inicio");
    const endCol = col("fecha termino", "termino");
    const totalCol = col("hh total", "hh totales");
    const weeklyCol = col("hh sem", "hh semanal", "hh semanales");
    const durationCol = col("dur sem", "duracion", "semanas");
    const commentsCol = col("comentarios", "observaciones");

    const existing = await supabase.from("work_items").select("client_name,title,start_date");
    if (existing.error) throw existing.error;
    const keys = new Set((existing.data ?? []).map((row) => `${normalizeHeader(row.client_name)}|${normalizeHeader(row.title)}|${row.start_date ?? ""}`));
    const reportToCesar = formData.get("report_to_cesar") === "on";
    let imported = 0;
    let skipped = 0;

    for (let r = headerRow + 1; r <= sheet.rowCount; r += 1) {
      const row = sheet.getRow(r);
      const client = String(row.getCell(clientCol).text || row.getCell(clientCol).value || "").trim();
      const title = String(row.getCell(titleCol).text || row.getCell(titleCol).value || "").trim();
      if (!client || !title) continue;
      const start = startCol ? excelDate(row.getCell(startCol).value) : null;
      const end = endCol ? excelDate(row.getCell(endCol).value) : null;
      const key = `${normalizeHeader(client)}|${normalizeHeader(title)}|${start ?? ""}`;
      if (keys.has(key)) { skipped += 1; continue; }
      keys.add(key);
      const duration = Math.max(1, durationCol ? numeric(row.getCell(durationCol).value, 1) : 1);
      const weekly = weeklyCol ? numeric(row.getCell(weeklyCol).value, 0) : 0;
      const total = totalCol ? numeric(row.getCell(totalCol).value, weekly * duration) : weekly * duration;
      const code = await buildCode(client, start);
      const { error } = await supabase.from("work_items").insert({
        code, client_name: client, title, type: "task", size: "pending", status: "inbox", source: "manual", area: "Diseño", category: "external",
        start_date: start, end_date: end, duration_weeks: duration, hh_total: Math.max(0, total), report_to_cesar: reportToCesar,
        comments: commentsCol ? String(row.getCell(commentsCol).text || "").trim() || null : null, created_by: user.id, updated_by: user.id,
      });
      if (error) throw error;
      imported += 1;
    }

    revalidatePath("/dashboard");
    revalidatePath("/trabajo");
    revalidatePath("/reporte");
    return { ok: true, message: `${imported} registro${imported === 1 ? "" : "s"} importado${imported === 1 ? "" : "s"}${skipped ? ` · ${skipped} duplicado${skipped === 1 ? "" : "s"} omitido${skipped === 1 ? "" : "s"}` : ""}.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No fue posible importar el archivo." };
  }
}

export async function promoteWorkItemAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { profile, supabase } = await getCurrentContext();
  if (!canEdit(profile.role)) return;
  await supabase.from("work_items").update({ type: "requirement", size: "large", report_to_cesar: true }).eq("id", id);
  revalidatePath("/trabajo");
  revalidatePath("/reporte");
}

export async function deleteWorkItemAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const { profile, supabase } = await getCurrentContext();
  if (profile.role !== "admin") return;
  await supabase.from("work_items").delete().eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/trabajo");
  revalidatePath("/reporte");
}
