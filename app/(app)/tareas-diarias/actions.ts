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

export async function deleteDailyTaskAction(formData: FormData) {
  const { profile, supabase } = await getCurrentContext();
  if (!canEdit(profile.role)) return;
  await supabase.from("daily_tasks").delete().eq("id", String(formData.get("id") ?? ""));
  revalidatePath("/tareas-diarias");
}
