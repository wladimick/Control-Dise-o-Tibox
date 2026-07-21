import fs from "node:fs";

function replaceOrFail(path, from, to) {
  const current = fs.readFileSync(path, "utf8");
  if (!current.includes(from)) throw new Error(`No encontré el bloque esperado en ${path}`);
  fs.writeFileSync(path, current.replace(from, to));
}

replaceOrFail(
  "components/daily-tasks/daily-tasks-batch-modal.tsx",
  'import { importDailyTasksAction } from "@/app/(app)/tareas-diarias/actions";\nimport type { TeamMember, WorkItem } from "@/lib/types";',
  'import { importDailyTasksAction } from "@/app/(app)/tareas-diarias/actions";\nimport { WorkItemCombobox } from "@/components/daily-tasks/work-item-combobox";\nimport type { TeamMember, WorkItem } from "@/lib/types";'
);

replaceOrFail(
  "components/daily-tasks/daily-tasks-batch-modal.tsx",
  '<td><select className="tbx-input min-w-64" value={task.work_item_id ?? ""} onChange={(event) => updateTask(task.id, { work_item_id: event.target.value || null })}><option value="">Sin asociar</option>{workItems.map((item) => <option key={item.id} value={item.id}>{item.client_name} · {item.title}</option>)}</select></td>',
  '<td><WorkItemCombobox items={workItems} value={task.work_item_id} onChange={(value) => updateTask(task.id, { work_item_id: value })} compact placeholder="Buscar por cliente, código o trabajo..." /></td>'
);

replaceOrFail(
  "components/daily-tasks/daily-task-modal.tsx",
  'import { saveDailyTaskAction } from "@/app/(app)/tareas-diarias/actions";\nimport { DAILY_STATUS_LABELS, SOURCE_LABELS } from "@/lib/constants";',
  'import { saveDailyTaskAction } from "@/app/(app)/tareas-diarias/actions";\nimport { WorkItemCombobox } from "@/components/daily-tasks/work-item-combobox";\nimport { DAILY_STATUS_LABELS, SOURCE_LABELS } from "@/lib/constants";'
);

replaceOrFail(
  "components/daily-tasks/daily-task-modal.tsx",
  'import { useActionState, useEffect } from "react";',
  'import { useActionState, useEffect, useState } from "react";'
);

replaceOrFail(
  "components/daily-tasks/daily-task-modal.tsx",
  '  const editable = canEdit(role);',
  '  const editable = canEdit(role);\n  const [workItemId, setWorkItemId] = useState<string | null>(task?.work_item_id ?? null);'
);

replaceOrFail(
  "components/daily-tasks/daily-task-modal.tsx",
  '<div><label className="tbx-label">Asociar a trabajo principal</label><select className="tbx-input" name="work_item_id" defaultValue={task?.work_item_id ?? ""} disabled={!editable}><option value="">Sin asociar por ahora</option>{workItems.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.client_name} · {item.title}</option>)}</select><p className="tbx-help">Las horas se contabilizan como ejecutadas sin modificar las HH estimadas del trabajo principal.</p></div>',
  '<div><label className="tbx-label">Asociar a trabajo principal</label><input type="hidden" name="work_item_id" value={workItemId ?? ""} /><WorkItemCombobox items={workItems} value={workItemId} onChange={setWorkItemId} disabled={!editable} placeholder="Buscar por cliente, código o trabajo..." /><p className="tbx-help">Las horas se contabilizan como ejecutadas sin modificar las HH estimadas del trabajo principal.</p></div>'
);

console.log("Buscador integrado correctamente.");
