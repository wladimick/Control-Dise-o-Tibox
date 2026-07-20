-- Equipo actual del Excel de César.
insert into public.team_members (full_name, short_name, area, role_title, sort_order) values
('César Medina', 'César', 'Subgerencia', 'Subgerente', 1),
('Fabian Alberto Díaz', 'Fabian', 'Analítica', 'Especialista IoT', 2),
('Estefania Andrea Manríquez', 'Estefania', 'Analítica', 'Consultor RPA Developer', 3),
('Renzo Bruno Beltrán', 'Renzo', 'Analítica', 'Consultor BI', 4),
('Joaquin Alfonso Moya', 'Joaquin', 'Analítica', 'Consultor Data Engineer', 5),
('Jorge Luis Bahamondes', 'Jorge', 'Analítica', 'Consultor IA', 6),
('Juan Abello', 'Juan', 'Desarrollo', 'Desarrollador', 7),
('Luis Arenas', 'Luis', 'Desarrollo', 'Desarrollador', 8),
('Francisco Leiva', 'Francisco', 'Desarrollo', 'Desarrollador', 9),
('Cristobal Trujillo', 'Cristobal', 'Desarrollo', 'Desarrollador', 10),
('Sebastian Retamales', 'Sebastian', 'Desarrollo', 'Desarrollador', 11),
('Sergio Navarro', 'Sergio', 'Desarrollo', 'Desarrollador', 12),
('Wladimick Díaz', 'Wladimick', 'Diseño', 'Diseñador (Lead)', 13),
('Braulio Castro', 'Braulio', 'Diseño', 'Diseñador', 14),
('Marcelo', 'Marcelo', 'Consultoría', 'Consultor (Lead)', 15),
('Nicole', 'Nicole', 'Consultoría', 'Consultor', 16)
on conflict (short_name) do update set full_name = excluded.full_name, area = excluded.area, role_title = excluded.role_title, sort_order = excluded.sort_order;

-- Registros iniciales comentados para que puedas revisar antes de cargarlos.
-- Las HH representan únicamente Diseño TI.
insert into public.work_items
(code, client_name, title, type, size, status, source, area, category, start_date, end_date, hh_total, report_to_cesar, comments)
values
('INM-26-01', 'In Motion', 'Mitigación de hallazgos de seguridad en VPS, cPanel y WordPress', 'prospect', 'large', 'in_progress', 'commercial', 'Diseño', 'external', '2026-07-20', '2026-08-14', 13.5, true, 'Se consideran 13,5 HH correspondientes al trabajo de Diseño TI a cargo de Wladimick. No incluye actividades de Infraestructura.'),
('PRO-26-03', 'Prodata', 'Servicio Growth Digital 360 + Hosting Web', 'prospect', 'large', 'in_progress', 'commercial', 'Diseño', 'external', '2026-07-03', '2027-07-02', 0, true, 'Prospecto comercial: 16 UF netas/mes, contrato de 1 año. HH pendientes de definición al adjudicar.'),
('VGM-26-13', 'VGM Consultores', 'SharePoint VGM – Reporte de actividad y uso documental D90 mediante PowerShell', 'requirement', 'large', 'completed', 'manual', 'Diseño', 'external', '2026-06-26', '2026-07-02', 8, true, 'Reporte generado con PowerShell/Microsoft Graph.'),
('VGM-26-14', 'VGM Consultores', 'SharePoint VGM – Nuevos sitios, corrección 580-AXXA y permisos 637', 'requirement', 'large', 'completed', 'support', 'Diseño', 'external', '2026-07-09', '2026-07-31', 8, true, 'Ticket 116973. Cambio 580-MILLENIUM a 580-AXXA, permisos TAX/OUT y creación de nuevas empresas.'),
('DDC-26-01', 'David del Curto S.A.', 'Actualización y homologación del sitio web en chino', 'requirement', 'large', 'in_progress', 'email', 'Diseño', 'external', '2026-06-26', '2026-07-31', 8, true, 'Cambios en ddc.cl/zh-hant. Pendiente recepción de traducciones finales y validación del equipo de China.'),
('AST-26-01', 'Aste & Jaramillo', 'Clonación y migración del sitio web a WordPress con hosting TIBOX', 'project', 'large', 'in_progress', 'support', 'Diseño', 'external', '2026-06-25', '2026-07-30', 16, true, 'Clonación realizada y sitio alojado en infraestructura TIBOX. Pendientes ajustes finales y validación.'),
('ECS-26-01', 'Ecoscience', 'Reconstrucción del sitio ecoscience.org en WordPress y alojamiento temporal', 'requirement', 'large', 'in_progress', 'support', 'Diseño', 'external', '2026-07-15', '2026-07-29', 12, true, 'Sitio reconstruido por falta de respaldo y alojado temporalmente en servidor TIBOX; pendiente definición de infraestructura/DNS.')
on conflict (code) do nothing;

-- Asignaciones iniciales. Se usan nombres cortos del equipo.
insert into public.work_item_assignments (work_item_id, team_member_id, percentage)
select wi.id, tm.id, values_table.percentage
from (values
  ('INM-26-01', 'Wladimick', 1.00::numeric),
  ('PRO-26-03', 'Wladimick', 0.50::numeric), ('PRO-26-03', 'Braulio', 0.50::numeric),
  ('VGM-26-13', 'Wladimick', 1.00::numeric),
  ('VGM-26-14', 'Wladimick', 1.00::numeric),
  ('DDC-26-01', 'Wladimick', 0.30::numeric), ('DDC-26-01', 'Braulio', 0.70::numeric),
  ('AST-26-01', 'Wladimick', 0.30::numeric), ('AST-26-01', 'Braulio', 0.70::numeric),
  ('ECS-26-01', 'Wladimick', 0.50::numeric), ('ECS-26-01', 'Braulio', 0.50::numeric)
) as values_table(code, short_name, percentage)
join public.work_items wi on wi.code = values_table.code
join public.team_members tm on tm.short_name = values_table.short_name
on conflict (work_item_id, team_member_id) do update set percentage = excluded.percentage;
