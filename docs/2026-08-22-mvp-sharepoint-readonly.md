# MVP SharePoint Audit · Solo lectura

Fecha: 2026-08-22
Autor: ChatGPT · GPT-5.6 Sol

## Objetivo

Reutilizar el repositorio `wladimick/Control-Dise-o-Tibox` como base para una nueva aplicación de auditoría SharePoint orientada inicialmente a lectura.

El MVP permite conectar sitios individuales mediante su URL y consultar metadatos reales desde Microsoft Graph sin ejecutar operaciones de escritura sobre SharePoint.

## Alcance implementado

- Portada nueva enfocada en inventario SharePoint.
- Ingreso manual de URL de sitio.
- Validación del sitio mediante Microsoft Graph.
- Lectura de:
  - Site ID.
  - Nombre visible.
  - URL.
  - Host.
  - Fecha de última modificación.
  - Bibliotecas de documentos visibles para la aplicación.
- Persistencia temporal de los sitios seleccionados mediante `localStorage`.
- Posibilidad de quitar un sitio de la vista local sin modificar SharePoint.
- Sin endpoints POST/PATCH/DELETE contra Microsoft Graph o SharePoint.
- Indicadores de Grupos, Permisos y Auditoría reservados para la siguiente fase.

## Arquitectura inicial

```text
Browser
  |
  | GET /api/sharepoint/site?url=...
  v
Next.js Route Handler
  |
  | client_credentials
  v
Microsoft Entra ID
  |
  | Bearer token
  v
Microsoft Graph
  |
  +-- GET /sites/{hostname}:/{relative-path}
  +-- GET /sites/{site-id}/drives
```

## Variables de entorno

```bash
MS_TENANT_ID=
MS_CLIENT_ID=
MS_CLIENT_SECRET=
```

Las credenciales solo se utilizan en servidor y no se exponen al navegador.

## Configuración de Entra ID

### Opción rápida para el MVP

Conceder a la App Registration el permiso de aplicación de Microsoft Graph:

- `Sites.Read.All`

Requiere consentimiento de administrador.

El código solo consulta las URLs agregadas a la interfaz, aunque este permiso permite técnicamente lectura en todas las colecciones de sitios del tenant.

### Opción recomendada para producción

Evaluar `Sites.Selected` y conceder rol `read` únicamente a los sitios autorizados. Esta alternativa requiere una asignación explícita de acceso por sitio y por eso se deja fuera del primer MVP.

## Seguridad

- El secreto de cliente nunca debe usar prefijo `NEXT_PUBLIC_`.
- No guardar el secreto en GitHub.
- Configurar las variables directamente en Vercel/hosting.
- Mantener la App Registration sin permisos de escritura.
- Rotar el secreto según política del tenant.

## Próxima fase

1. Persistir sitios conectados en base de datos.
2. Leer grupos Microsoft Entra ID y sus integrantes.
3. Leer grupos clásicos de SharePoint.
4. Leer RoleAssignments del sitio, bibliotecas y carpetas.
5. Detectar permisos exclusivos vs. heredados.
6. Resolver usuario -> grupo -> permiso efectivo.
7. Comparar permisos reales con la matriz Excel esperada.
8. Agregar auditorías históricas sin habilitar escritura sobre SharePoint.

## Notas sobre la aplicación anterior

El flujo principal y la portada fueron reemplazados para el MVP. Las rutas legacy todavía permanecen en el branch para evitar una eliminación destructiva antes de validar la nueva aplicación. Pueden retirarse en una limpieza posterior cuando el MVP quede aprobado.
