# Control Diseño TI · TIBOX

Aplicación pequeña para que Diseño TI gestione tareas, requerimientos, proyectos y prospectos sin editar directamente el Excel consolidado de César.

## Incluye

- Login con Supabase Auth.
- Roles: administrador, editor y solo lectura.
- Bandeja de trabajo con filtros, orden y columnas ocultables.
- Preferencias de columnas guardadas en el navegador.
- Tareas pequeñas/grandes y opción explícita **Reportar a César**.
- Asignación porcentual entre integrantes del equipo.
- Cálculo automático de duración y HH semanales.
- Exportación Excel compatible con la estructura principal del consolidado.
- Dashboard con carga activa y pendientes de clasificación.
- Tareas diarias por Wladimick y Braulio, con HH reales, filtros, columnas configurables y asociación a trabajos principales.
- Diseño TIBOX: portal claro, compacto, tipografías y tokens de marca.

## 1. Crear el proyecto Supabase

1. Crea un proyecto en Supabase.
2. Abre **SQL Editor**.
3. Ejecuta `supabase/migrations/20260720_initial.sql`.
4. Ejecuta `supabase/migrations/20260721_daily_tasks.sql`.
5. Opcional: ejecuta `supabase/seed.sql` para cargar el equipo y los registros iniciales de julio de 2026.
6. En **Authentication > Users**, crea manualmente los usuarios de Wladimick, Braulio y César.
7. Ejecuta las instrucciones comentadas al final de la migración para asignar los roles por correo.

La aplicación no expone registro público. Los usuarios se crean desde Supabase.

## 2. Variables de entorno

Copia el ejemplo:

```bash
cp .env.example .env.local
```

Reemplaza los valores de Supabase en `.env.local`.

## 3. Ejecutar localmente

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## 4. Subir a GitHub

```bash
git init
git add .
git commit -m "feat: crear Control Diseño TI"
git branch -M main
git remote add origin URL_DE_TU_REPO
git push -u origin main
```

El repositorio puede ser privado. No subas `.env.local`; ya está excluido por `.gitignore`.

## 5. Publicar en Vercel

1. Importa el repositorio desde Vercel.
2. Agrega las variables de `.env.example` en **Project Settings > Environment Variables**.
3. Despliega.
4. En Supabase, agrega la URL de producción en **Authentication > URL Configuration**.

## Roles

- `admin`: crear, editar y eliminar.
- `editor`: crear y editar.
- `viewer`: consultar y descargar Excel.

Ejemplo para asignar roles después de crear los usuarios:

```sql
update public.profiles set role = 'admin' where email = 'wdiaz@tibox.cl';
update public.profiles set role = 'editor' where email = 'CORREO_BRAULIO';
update public.profiles set role = 'viewer' where email = 'CORREO_CESAR';
```

## Criterio operativo sugerido

- Una tarea nueva queda como `Pendiente` y **no se reporta a César**.
- Tarea pequeña: trabajo puntual interno.
- Tarea grande: puede promoverse a requerimiento/proyecto.
- `Reportar a César` es una decisión explícita e independiente del tamaño.
- Las HH representan exclusivamente la carga del Área de Diseño registrada en este sistema.
