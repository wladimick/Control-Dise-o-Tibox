"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentContext } from "@/lib/auth";
import { parseWorkItemsFile } from "@/lib/import-work-items";
import type { ActionState, TeamMember } from "@/lib/types";
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

function normalizeKey(client: string, title: string, startDate: string | null) {
  return [client, title, startDate ?? ""]
    .join("|")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function importedCode(client: string, startDate: string | null, counters: Map<string, number>) {
  const year = (startDate ? new Date(`${startDate}T00:00:00Z`).getUTCFullYear() : new Date().getFullYear()).toString().slice(-2);
  const prefix = `${codePrefix(client)}-${year}`;
  const next = (counters.get(prefix) ?? 0) + 1;
  counters.set(prefix, next);
  return `${prefix}-${String(next).padStart(2, "0")}`;
}

function chunks<T>(values: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
}

export async function importWorkItemsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const { profile, user, supabase } = await getCurrentContext();
  if (!canEdit(profile.role)) return { error: "Tu perfil es de solo lectura." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Selecciona un archivo para importar." };
  if (file.size > 8 * 1024 * 1024) return { error: "El archivo supera el máximo de 8 MB." };

  try {
    const parsedItems = await parseWorkItemsFile(file);
    if (!parsedItems.length) return { error: "No encontré filas válidas para importar." };

    const [{ data: existingRows, error: existingError }, { data: codeRows, error: codeError }, { data: teamRows, error: teamError }] = await Promise.all([
      supabase.from("work_items").select("client_name,title,start_date"),
      supabase.from("work_items").select("code"),
      supabase.from("team_members").select("id,short_name").eq("active", true),
    ]);
    if (existingError) throw existingError;
    if (codeError) throw codeError;
    if (teamError) throw teamError;

    const existingKeys = new Set((existingRows ?? []).map((row) => normalizeKey(row.client_name, row.title, row.start_date)));
    const counters = new Map<string, number>();
    for (const row of codeRows ?? []) {
      const match = String(row.code).match(/^(.+-\d{2})-(\d+)$/);
      if (!match) continue;
      counters.set(match[1], Math.max(counters.get(match[1]) ?? 0, Number(match[2])));
    }

    const reportToCesar = formData.get("report_to_cesar") === "on";
    const uniqueRows = [] as Array<(typeof parsedItems)[number] & { code: string }>;
    let skipped = 0;
    for (const item of parsedItems) {
      const key = normalizeKey(item.client_name, item.title, item.start_date);
      if (existingKeys.has(key)) {
        skipped += 1;
        continue;
      }
      existingKeys.add(key);
      uniqueRows.push({ ...item, code: importedCode(item.client_name, item.start_date, counters) });
    }

    const insertedByCode = new Map<string, string>();
    for (const batch of chunks(uniqueRows, 100)) {
      const payload = batch.map((item) => ({
        code: item.code,
        client_name: item.client_name,
        title: item.title,
        type: item.type,
        size: item.size,
        status: item.status,
        source: item.source,
        source_reference: item.source_reference,
        source_url: item.source_url,
        area: item.area,
        category: item.category,
        start_date: item.start_date,
        end_date: item.end_date,
        duration_weeks: item.duration_weeks,
        hh_total: item.hh_total,
        comments: item.comments,
        report_to_cesar: reportToCesar,
        created_by: user.id,
        updated_by: user.id,
      }));
      const { data, error } = await supabase.from("work_items").insert(payload).select("id,code");
      if (error) throw error;
      for (const row of data ?? []) insertedByCode.set(row.code, row.id);
    }

    const members = new Map((teamRows ?? []).map((member: Pick<TeamMember, "id" | "short_name">) => [member.short_name.toLowerCase(), member.id]));
    const assignmentRows = uniqueRows.flatMap((item) => {
      const workItemId = insertedByCode.get(item.code);
      if (!workItemId) return [];
      return item.assignments.flatMap((assignment) => {
        const memberId = members.get(assignment.shortName.toLowerCase());
        return memberId ? [{ work_item_id: workItemId, team_member_id: memberId, percentage: assignment.percentage }] : [];
      });
    });
    for (const batch of chunks(assignmentRows, 200)) {
      const { error } = await supabase.from("work_item_assignments").insert(batch);
      if (error) throw error;
    }

    revalidatePath("/dashboard");
    revalidatePath("/trabajo");
    revalidatePath("/reporte");
    return {
      ok: true,
      message: `${uniqueRows.length} registro${uniqueRows.length === 1 ? "" : "s"} importado${uniqueRows.length === 1 ? "" : "s"}${skipped ? ` · ${skipped} duplicado${skipped === 1 ? "" : "s"} omitido${skipped === 1 ? "" : "s"}` : ""}.`,
    };
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
