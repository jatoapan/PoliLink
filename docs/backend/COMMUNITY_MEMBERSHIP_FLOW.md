# Flujo de comunidades y membresías

**Estado:** esquema base, directorio público, membresías propias y aprobación
administrativa de comunidades implementados; las pantallas frontend siguen
pendientes.

Este flujo separa la cuenta global, la administración del sistema y la
pertenencia a una comunidad. Una persona puede ser miembro de varias
comunidades y tener un rol principal distinto en cada una.

## Modelo actual

- `users` contiene identidad, credenciales e `is_admin`. No existen roles
  globales `student` u `organizer`.
- `communities` representa clubes y organizaciones; `slug` identifica el
  perfil público, `is_active` controla su visibilidad e `image_path` guarda el
  logo opcional.
- `community_creation_requests` conserva las propuestas antes de su aprobación
  y usa el enum `CommunityCreationRequestStatus` con `pending`, `approved` y
  `rejected`. Sus etiquetas en español provienen de `lang/es/statuses.php`.
- `community_memberships` relaciona de forma única a un usuario con una
  comunidad y conserva su rol y estado.
- Los roles comunitarios son `member`, `organizer` y `tutor`.
- Los estados de membresía son el enum `MembershipStatus`: `pending`, `active`,
  `rejected` y `left`; las respuestas incluyen sus etiquetas en español.
- `events` apunta directamente a `community_id`.
- `registrations` apunta a `user_id`; cualquier usuario autenticado puede
  inscribirse.

El rol `organizer` implica una membresía activa y permite crear, editar,
cancelar y administrar imágenes de eventos de esa comunidad. `tutor` es una
etiqueta para identificar al profesor tutor y no concede permisos de escritura.
Los profesores de apoyo pueden permanecer como `member`.

`is_admin` concede administración global de catálogos y revisión de propuestas
de creación. No convierte a una persona en organizador de ninguna comunidad
automáticamente.

## Directorio público — implementado

El backend ofrece un directorio separado del catálogo de filtros:

- `GET /communities/discover` permite buscar por nombre y pagina comunidades
  activas, incluidas las que aún no tienen eventos.
- `GET /communities/{community:slug}` devuelve `id`, `name`, `slug`,
  `description` e `image_url` sin exponer membresías, usuarios ni roles.
- `GET /events?community_id={id}` se reutiliza para cargar los eventos
  publicados del perfil.

`GET /communities` conserva su contrato anterior y solo devuelve comunidades
  con eventos publicados para los filtros del catálogo.

## Solicitudes propias — implementado

El usuario autenticado puede solicitar una membresía sin enviar su identidad,
rol ni estado. El backend siempre crea o reactiva una relación `pending/member`.

| Estado actual | Resultado de `POST` |
| --- | --- |
| Sin fila | Crea `pending/member` y responde `201`. |
| `pending` | Rechaza la duplicación con `409`. |
| `active` | Rechaza la duplicación con `409`, sin importar el rol. |
| `rejected` o `left` | Reutiliza la fila como `pending/member` y responde `200`. |

La reactivación actualiza `requested_at` y limpia la información de revisión.

`DELETE /communities/{community}/membership-requests` cambia a `left` una
solicitud `pending` o una membresía activa `member`/`tutor`. No borra datos.
Un `organizer` activo no puede abandonar todavía porque aún no existe la
transferencia de responsabilidad.

`GET /me/memberships` devuelve todas las membresías del usuario actual,
incluidos `pending`, `active`, `rejected` y `left`, ordenadas por nombre de
comunidad y paginadas.

## Experiencia propuesta

### 1. Descubrir una comunidad

El estudiante entra a `/comunidades` y busca por nombre, por ejemplo `CIAP`.
También puede llegar desde una tarjeta o detalle de evento, el catálogo
público o su cuenta. Los eventos publicados siguen siendo públicos; la
membresía agrega contexto y personalización.

### 2. Revisar el perfil

`/comunidades/:slug` muestra nombre, descripción y eventos publicados. El
frontend debe usar el `slug` recibido en el directorio; el `id` numérico se
reserva para cargar eventos, solicitar membresía o administrar el logo.
El CTA depende del estado:

| Estado | Acción visible |
| --- | --- |
| Visitante | `Iniciar sesión para unirte` |
| Sin membresía | `Solicitar unirme` |
| Solicitud pendiente | `Solicitud enviada` |
| Miembro activo | `Eres miembro` |
| Organizador activo | `Administrar comunidad` |

### 3. Solicitar membresía

El usuario autenticado solicita pertenecer a una comunidad. El backend crea o
reactiva una relación `pending/member`; la interfaz no puede asignar `active`,
`organizer` ni `tutor`.

### 4. Revisar solicitudes

Solo un `organizer` activo de esa comunidad puede aprobar o rechazar
solicitudes. Al aprobar, la membresía cambia a `active/member`. El mismo
organizador puede asignar después el rol `tutor` cuando corresponda. Ningún
rol comunitario concede aprobación administrativa de eventos.

### 5. Mis comunidades

`/mis-comunidades` debe reservarse para membresías propias. El panel de
comunidades administradas debe permanecer en `/organizar` o
`/organizar/panel`. La implementación actual todavía usa `/mis-comunidades`
para comunidades administradas; la migración de esa pantalla pertenece a la
integración frontend de esta fase.

## Aprobación administrativa de comunidades — implementada

La creación ya no es directa. Los paths del backend conservan el idioma inglés
del contrato actual.

| Método | Endpoint | Actor | Propósito |
| --- | --- | --- | --- |
| `POST` | `/community-creation-requests` | Usuario autenticado | Crear una propuesta `pending`. |
| `GET` | `/me/community-creation-requests` | Usuario autenticado | Consultar sus propuestas. |
| `GET` | `/admin/community-creation-requests` | Admin | Listar propuestas para revisión. |
| `PATCH` | `/admin/community-creation-requests/{request}/approve` | Admin | Crear la comunidad y asignar `active/organizer` al solicitante. |
| `PATCH` | `/admin/community-creation-requests/{request}/reject` | Admin | Rechazar con una razón. |

La propuesta acepta una imagen opcional. El backend genera y devuelve un `slug`
a partir del nombre; el frontend no lo envía. El archivo se guarda temporalmente en
`community-requests/`; al aprobarse se mueve a `communities/`. Al aprobar, la
comunidad se crea activa y el solicitante queda como su organizador. Una
solicitud procesada no puede revisarse nuevamente. El admin no tiene en esta
fase un endpoint para desactivar comunidades.

El organizador activo puede reemplazar o quitar el logo de su comunidad con:

- `POST /communities/{community}/image`
- `DELETE /communities/{community}/image`

Ambos endpoints usan el disco público del backend y exponen `image_url`. Las
imágenes aceptan JPEG, PNG o WebP de máximo 5 MB.

El endpoint existente `GET /communities` conserva su propósito de alimentar los
filtros con comunidades que tienen eventos publicados.

## Creación de comunidades

Un usuario autenticado propone una comunidad, pero no obtiene permisos ni crea
un registro público hasta que un administrador la aprueba. Este control no
pretende validar pertenencia institucional: la plataforma todavía no tiene una
fuente autorizada para verificar CIAP u otra organización.

## Fases siguientes

1. Integración frontend del directorio, perfiles y logos.
2. Integración frontend de solicitudes y estados de membresía.
3. Panel frontend para revisar propuestas administrativas.
4. Asignación de `tutor` por un organizador y espacio de membresías.
5. Moderación futura de comunidades, si se aprueba ese alcance.

La base actual ya soporta la relación normalizada; las fases pendientes deben
agregar sus APIs y policies sin volver a crear `community_organizers` ni roles
globales de comunidad.
