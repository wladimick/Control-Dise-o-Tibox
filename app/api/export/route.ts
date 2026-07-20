import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const teamColumns = [
  ["César", "Subgerencia"],
  ["Fabian", "Analítica"], ["Estefania", "Analítica"], ["Renzo", "Analítica"], ["Joaquin", "Analítica"], ["Jorge", "Analítica"],
  ["Juan", "Desarrollo"], ["Luis", "Desarrollo"], ["Francisco", "Desarrollo"], ["Cristobal", "Desarrollo"], ["Sebastian", "Desarrollo"], ["Sergio", "Desarrollo"],
  ["Wladimick", "Diseño"], ["Braulio", "Diseño"],
  ["Marcelo", "Consultoría"], ["Nicole", "Consultoría"],
] as const;

function excelType(type: string) {
  return ({ task: "Tarea", requirement: "Requerimiento", project: "Proyecto", prospect: "Prospecto", support: "Soporte" } as Record<string, string>)[type] ?? type;
}
function excelStatus(status: string) {
  return ({ inbox: "En Curso", planned: "En Curso", in_progress: "En Curso", blocked: "En Curso", completed: "Terminado", archived: "Archivado", discarded: "Descartado" } as Record<string, string>)[status] ?? status;
}
function excelCategory(category: string) { return category === "internal" ? "Interno" : "Externo"; }

export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { data, error } = await supabase
    .from("work_items")
    .select(`*, assignments:work_item_assignments(percentage, team_member:team_members(short_name))`)
    .eq("report_to_cesar", true)
    .order("start_date", { ascending: true, nullsFirst: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Control Diseño TI · TIBOX";
  const sheet = workbook.addWorksheet("Proyectos", { views: [{ state: "frozen", ySplit: 2, xSplit: 2 }] });

  const headers = ["ID", "Cliente", "Proyecto", "Tipo", "Área principal", "Año(s)", "Fecha Inicio", "Fecha Término", "Dur. (sem)", "Estado", "Categoría", "HH Sem.", "HH Total", ...teamColumns.map(([name]) => name), "Comentarios", "Act. 2023", "Act. 2024", "Act. 2025", "Act. 2026"];
  const groupRow = new Array(headers.length).fill("");
  groupRow[13] = "Subgerencia";
  groupRow[14] = "Analítica";
  groupRow[19] = "Desarrollo";
  groupRow[25] = "Diseño";
  groupRow[27] = "Consultoría";
  sheet.addRow(groupRow);
  sheet.addRow(headers);

  sheet.mergeCells("N1:N1");
  sheet.mergeCells("O1:S1");
  sheet.mergeCells("T1:Y1");
  sheet.mergeCells("Z1:AA1");
  sheet.mergeCells("AB1:AC1");

  for (const item of data ?? []) {
    const start = item.start_date ? new Date(`${item.start_date}T00:00:00Z`) : null;
    const end = item.end_date ? new Date(`${item.end_date}T00:00:00Z`) : null;
    const startYear = start?.getUTCFullYear();
    const endYear = end?.getUTCFullYear() ?? startYear;
    const years = startYear && endYear ? (startYear === endYear ? String(startYear) : `${startYear}–${endYear}`) : "";
    const assignments = new Map<string, number>();
    for (const assignment of item.assignments ?? []) {
      const member = Array.isArray(assignment.team_member) ? assignment.team_member[0] : assignment.team_member;
      if (member?.short_name) assignments.set(member.short_name, Number(assignment.percentage));
    }
    const activity = [2023, 2024, 2025, 2026].map((year) => startYear && endYear && year >= startYear && year <= endYear ? "✓" : "");
    sheet.addRow([
      item.code, item.client_name, item.title, excelType(item.type), item.area, years,
      start, end, Number(item.duration_weeks), excelStatus(item.status), excelCategory(item.category),
      Number(item.hh_weekly), Number(item.hh_total),
      ...teamColumns.map(([name]) => assignments.get(name) ?? null),
      item.comments ?? "", ...activity,
    ]);
  }

  sheet.getRow(1).height = 24;
  sheet.getRow(2).height = 38;
  for (const row of [sheet.getRow(1), sheet.getRow(2)]) {
    row.font = { bold: true, color: { argb: "FFFFFFFF" }, name: "Titillium Web" };
    row.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    row.eachCell((cell) => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF17325C" } }; cell.border = { bottom: { style: "thin", color: { argb: "FF9CCAE0" } } }; });
  }
  const groupFills: Record<string, string> = { N1: "FF486783", O1: "FF2E5B88", T1: "FF2D6A58", Z1: "FF792C84", AB1: "FF944A18" };
  Object.entries(groupFills).forEach(([address, color]) => { sheet.getCell(address).fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } }; });

  sheet.columns.forEach((column, index) => {
    const widths = [14, 22, 48, 18, 17, 12, 13, 13, 11, 14, 13, 11, 11, ...new Array(16).fill(11), 55, 11, 11, 11, 11];
    column.width = widths[index] ?? 14;
  });
  sheet.getColumn(7).numFmt = "dd-mm-yyyy";
  sheet.getColumn(8).numFmt = "dd-mm-yyyy";
  sheet.getColumn(12).numFmt = "0.000";
  sheet.getColumn(13).numFmt = "0.00";
  for (let col = 14; col <= 29; col += 1) sheet.getColumn(col).numFmt = "0%";

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 2) return;
    row.alignment = { vertical: "top", wrapText: true };
    row.font = { name: "Titillium Web", size: 10 };
    row.eachCell((cell) => { cell.border = { bottom: { style: "hair", color: { argb: "FFD9E0E8" } } }; });
  });
  sheet.autoFilter = { from: "A2", to: "AH2" };

  const buffer = await workbook.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Reporte_Diseno_TI_${date}.xlsx"`,
    },
  });
}
