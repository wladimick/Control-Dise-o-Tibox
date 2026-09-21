"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentContext } from "@/lib/auth";
import type { ActionState } from "@/lib/types";
import { canEdit, toNumber } from "@/lib/utils";

const schema = z.object({
  client_name: z.string().trim().min(2, "Ingresa el cliente."),
  title: z.string().trim().min(3, "Ingresa un título."),
  type: z.enum(["task", "requirement", "project", "prospect", "support"]),
  status: z.enum(["inbox", "planned", "in_progress", "in_review", "blocked", "completed", "archived", "discarded"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  source: z.enum(["manual", "support", "projects", "email", "commercial", "other"]),
});

function prefix(client: string) {
  const clean = client.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9 ]/g, "");
  return clean.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 3).toUpperCase().padEnd(3, "X");
}

async function nextCode(client: string, date: string | null) {
  const { supabase } = await getCurrentContext();
  const year = (date ? new Date(`${date}T00:00:00Z`).getUTCFullYear() : new Date().getFullYear()).toString().slice(-2);
  const base = `${prefix(client)}-${year}`;
  const { data } = await supabase.from("work_items").select("code").like("code", `${base}-%`);
  const max = (data ?? []).reduce((current, row) => Math.max(current, Number(String(row.code).split("-").at(-1)) || 0), 0);
  return `${base}-${String(max + 1).padStart(2, "0")}`;
}

export async function saveOperationalTask(_: ActionState, formData: FormData): Promise<ActionState> {
  const { profile, user, supabase } = await getCurrentContext();
  if (!canEdit(profile.role)) return { error: "Tu perfil es de solo lectura." };

  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Revisa el formulario." };

  const id = String(formData.get("id") ?? "").trim();
  const startDate = String(formData.get("start_date") ?? "").trim() || null;
  const dueDate = String(formData.get("due_date") ?? "").trim() || null;
  const publishDate = String(formData.get("publish_date") ?? "").trim() || null;
  const size = String(formData.get("size") ?? "pending") as "pending" | "small" | "large";
  const existingCode = String(formData.get("code") ?? "").trim();

  const payload = {
    ...parsed.data,
    code: existingCode || (id ? undefined : await nextCode(parsed.data.client_name, startDate ?? dueDate)),
    size,
    description: String(formData.get("description") ?? "").trim() || null,
    source_reference: String(formData.get("source_reference") ?? "").trim() || null,
    source_url: String(formData.get("source_url") ?? "").trim() || null,
    start_date: startDate,
    end_date: dueDate,
    due_date: dueDate,
    duration_weeks: Math.max(1, toNumber(formData.get("duration_weeks"), 1)),
    hh_total: Math.max(0, toNumber(formData.get("hh_total"), 0)),
    area: "Diseño",
    category: String(formData.get("category") ?? "external") === "internal" ? "internal" : "external",
    report_to_cesar: formData.get("report_to_cesar") === "on",
    comments: String(formData.get("comments") ?? "").trim() || null,
    parent_work_item_id: String(formData.get("parent_work_item_id") ?? "").trim() || null,
    channel: String(formData.get("channel") ?? "").trim() || null,
    content_type: String(formData.get("content_type") ?? "").trim() || null,
    publish_date: publishDate,
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

    const memberIds = formData.getAll("assignment_member_id").map(String);
    const assignments = memberIds.map((team_member_id) => ({
      work_item_id: workItemId,
      team_member_id,
      percentage: toNumber(formData.get(`assignment_${team_member_id}`), 0) / 100,
    })).filter((row) => row.percentage > 0);
    const total = assignments.reduce((sum, row) => sum + row.percentage, 0);
    if (assignments.length && Math.abs(total - 1) > .001) throw new Error("Las asignaciones deben sumar 100 %.");

    const { error: deleteError } = await supabase.from("work_item_assignments").delete().eq("work_item_id", workItemId);
    if (deleteError) throw deleteError;
    if (assignments.length) {
      const { error } = await supabase.from("work_item_assignments").insert(assignments);
      if (error) throw error;
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "No fue posible guardar la tarea." };
  }

  revalidatePath("/dashboard");
  revalidatePath("/trabajo");
  revalidatePath("/reporte");
  return { ok: true, message: id ? "Tarea actualizada." : "Tarea creada." };
}
