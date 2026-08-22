# SharePoint Audit · TIBOX

MVP para inventariar y auditar sitios Microsoft SharePoint en **modo solo lectura**.

La aplicación reutiliza este repositorio como base de una nueva solución. La aplicación anterior queda fuera del flujo principal y se mantiene temporalmente en rutas legacy hasta validar el MVP.

## Qué hace el MVP

- Permite agregar manualmente la URL de un sitio SharePoint.
- Valida el sitio contra Microsoft Graph.
- Lee nombre, URL, Site ID y última modificación.
- Lista bibliotecas de documentos visibles.
- Guarda temporalmente los sitios seleccionados en el navegador.
- No crea, modifica ni elimina contenido o permisos en SharePoint.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Microsoft Graph

## Configuración Microsoft 365

Crea una App Registration en Microsoft Entra ID y configura estas variables de entorno:

```bash
MS_TENANT_ID=
MS_CLIENT_ID=
MS_CLIENT_SECRET=
```

Para el primer MVP, el permiso de aplicación más directo es:

```text
Microsoft Graph
Sites.Read.All
```

Este permiso requiere consentimiento de administrador.

> Para producción se recomienda evaluar `Sites.Selected` con acceso `read` asignado únicamente a los sitios autorizados.

## Desarrollo

```bash
npm install
npm run dev
```

Validaciones disponibles:

```bash
npm run typecheck
npm run lint
npm run build
```

## Seguridad

- Las credenciales de Entra ID son únicamente de servidor.
- Nunca usar `NEXT_PUBLIC_` para el secreto.
- No subir secretos al repositorio.
- La integración implementada utiliza solicitudes `GET` hacia Microsoft Graph.

## Roadmap inmediato

1. Persistencia de sitios seleccionados.
2. Lectura de grupos de seguridad e integrantes.
3. Lectura de grupos SharePoint.
4. Lectura de permisos y RoleAssignments.
5. Detección de permisos heredados/exclusivos.
6. Vista por usuario: dónde tiene acceso y por qué grupo.
7. Comparación automática contra la matriz Excel esperada.

La especificación técnica inicial está en `docs/2026-08-22-mvp-sharepoint-readonly.md`.
