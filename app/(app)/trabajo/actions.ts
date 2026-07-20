"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
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

export async function saveWorkItemAction(_: ActionState, formData: FormData): Promise<ActionState> {
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
  redirect("/trabajo");
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
