"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentContext } from "@/lib/auth";
import type { ActionState } from "@/lib/types";
import { canEdit, toNumber } from "@/lib/utils";

const schema = z.object({
  team_member_id: z.string().uuid(),
  task_date: z.string().min(10),
  client_name: z.string().trim().min(2, "Ingresa el cliente."),
  description: z.string().trim().min(3, "Describe la tarea."),
  source: z.enum(["manual", "support", "projects", "email", "commercial", "other"]),
  status: z.enum(["pending", "done", "blocked"]),
});

const batchItemSchema = schema.extend({
  work_item_id: z.string().uuid().nullable().optional(),
  hours: z.number().min(0.25).max(24),
  source_reference: z.string().trim().nullable().optional(),
  source_url: z.string().trim().nullable().optional(),
  comments: z.string().trim().nullable().optional(),
});

export async function saveDailyTaskAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const { profile, user, supabase } = await getCurrentContext();
  if (!canEdit(profile.role)) return { error: "Tu perfil es de solo lectura." };
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa el formulario." };
  const id = String(formData.get("id") ?? "").trim();
  const payload = {
    ...parsed.data,
    work_item_id: String(formData.get("work_item_id") ?? "").trim() || null,
    hours: Math.max(.25, toNumber(formData.get("hours"), .25)),
    source_reference: String(formData.get("source_reference") ?? "").trim() || null,
    source_url: String(formData.get("source_url") ?? "").trim() || null,
    comments: String(formData.get("comments") ?? "").trim() || null,
    updated_by: user.id,
  };
  const query = id
    ? supabase.from("daily_tasks").update(payload).eq("id", id)
    : supabase.from("daily_tasks").insert({ ...payload, created_by: user.id });
  const { error } = await query;
  if (error) return { error: error.message };
  revalidatePath("/tareas-diarias");
  return { ok: true, message: id ? "Tarea actualizada." : "Tarea registrada." };
}

function duplicateKey(task: { team_member_id: string; task_date: string; client_name: string; description: string; hours: number }) {
  return [task.team_member_id, task.task_date, task.client_name, task.description, task.hours]
    .join("|")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export async function importDailyTasksAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const { profile, user, supabase } = await getCurrentContext();
  if (!canEdit(profile.role)) return { error: "Tu perfil es de solo lectura." };

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("tasks_json") ?? "[]"));
  } catch {
    return { error: "La vista previa contiene datos inválidos." };
  }

  const parsed = z.array(batchItemSchema).min(1).max(100).safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa las tareas detectadas." };

  const dates = parsed.data.map((task) => task.task_date).sort();
  const memberIds = [...new Set(parsed.data.map((task) => task.team_member_id))];
  const { data: existing, error: existingError } = await supabase
    .from("daily_tasks")
    .select("team_member_id,task_date,client_name,description,hours")
    .in("team_member_id", memberIds)
    .gte("task_date", dates[0])
    .lte("task_date", dates[dates.length - 1]);
  if (existingError) return { error: existingError.message };

  const known = new Set((existing ?? []).map(duplicateKey));
  const insertRows = parsed.data.filter((task) => {
    const key = duplicateKey(task);
    if (known.has(key)) return false;
    known.add(key);
    return true;
  }).map((task) => ({
    ...task,
    work_item_id: task.work_item_id || null,
    source_reference: task.source_reference || null,
    source_url: task.source_url || null,
    comments: task.comments || null,
    created_by: user.id,
    updated_by: user.id,
  }));

  if (!insertRows.length) return { error: "Todas las filas ya estaban registradas." };
  const { error } = await supabase.from("daily_tasks").insert(insertRows);
  if (error) return { error: error.message };

  revalidatePath("/tareas-diarias");
  const skipped = parsed.data.length - insertRows.length;
  return {
    ok: true,
    message: `${insertRows.length} tarea${insertRows.length === 1 ? "" : "s"} agregada${insertRows.length === 1 ? "" : "s"}${skipped ? ` · ${skipped} duplicada${skipped === 1 ? "" : "s"} omitida${skipped === 1 ? "" : "s"}` : ""}.`,
  };
}

export async function deleteDailyTaskAction(formData: FormData) {
  const { profile, supabase } = await getCurrentContext();
  if (!canEdit(profile.role)) return;
  await supabase.from("daily_tasks").delete().eq("id", String(formData.get("id") ?? ""));
  revalidatePath("/tareas-diarias");
}
