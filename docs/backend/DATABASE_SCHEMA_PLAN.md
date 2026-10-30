# Modelo de base de datos de PoliLink

**Estado:** Implementado localmente con migraciones limpias.

El modelo separa la administración global del sistema de la pertenencia a una
comunidad. Un usuario normal no necesita un registro de rol global; `is_admin`
es el único privilegio global actual. Los roles `member`, `organizer` y `tutor`
pertenecen a una membresía concreta.

## Tablas principales

| Tabla | Propósito y restricciones |
| --- | --- |
| `users` | Identidad, credenciales e `is_admin BOOLEAN NOT NULL DEFAULT FALSE`. `email` es único. |
| `communities` | Comunidades con `name` y `slug` únicos, descripción opcional, `is_active` e `image_path` nullable. |
| `community_roles` | Catálogo fijo: `member`, `organizer`, `tutor`; `code` y `name` únicos. |
| `community_memberships` | Relación única usuario-comunidad con `community_role_id`, `status`, fechas de solicitud/revisión y `reviewed_by`. |
| `community_creation_requests` | Propuestas con `name` y `slug`, imagen temporal/definitiva, solicitante, revisor, estado, razón y comunidad creada. |
| `events` | Evento relacionado directamente con `community_id`, catálogos, estado, imagen opcional, fecha y capacidad. |
| `registrations` | Relación `event_id`–`user_id`, estado y fechas; `UNIQUE (event_id, user_id)`. |

### Identificación de comunidades y consumo desde el frontend

Las tablas de comunidades tienen estos campos relevantes:

```text
communities:
id, name, slug, description, is_active, image_path, created_at, updated_at

community_creation_requests:
id, name, slug, description, image_path, requested_by, status,
reviewed_by, reviewed_at, rejection_reason, community_id, created_at, updated_at
```

`slug` es un identificador público generado por el backend a partir de
`name` mediante normalización tipo URL. Es obligatorio, único en
`communities` y permanece estable aunque después cambie el nombre visible. En
las solicitudes pendientes también se impide reutilizar el mismo slug; una
solicitud rechazada no reserva indefinidamente ese identificador.

El frontend debe aplicar estas reglas:

- Usar `slug` para enlaces y perfiles públicos: `GET /api/communities/{slug}`.
  En la declaración Laravel la ruta aparece como
  `GET /communities/{community:slug}`; `{community:slug}` no es un texto que
  se envía literalmente, sino un binding por la columna `slug`.
- Conservar `id` para operaciones autenticadas y filtros que usan
  `community_id`: solicitudes de membresía, imágenes de comunidad, creación o
  edición de eventos y `GET /api/events?community_id={id}`.
- Esperar `id`, `name`, `slug`, `description` e `image_url` en cada recurso de
  comunidad. `image_path` es interno del backend y nunca debe construirse en
  la interfaz.
- Enviar a `POST /api/community-creation-requests` solamente `name`,
  `description` e `image` opcional. El cliente no envía `slug`, `status`,
  `requested_by` ni `community_id`; la respuesta sí incluye el `slug`
  generado y el estado de la propuesta.

Ejemplo del objeto que puede reutilizarse en tipos, formularios de lectura y
tarjetas del frontend:

```json
{
  "id": 1,
  "name": "Club de Robótica",
  "slug": "club-de-robotica",
  "description": "Comunidad de robótica de ESPOL.",
  "image_url": null
}
```

Los estados inmutables se guardan como enums en la base de datos y se castean a
enums PHP. Sus nombres visibles en español viven en
`backend/lang/es/statuses.php`; no son tablas editables del catálogo:

| Campo | Valores permitidos |
| --- | --- |
| `events.status` | `published`, `cancelled` |
| `registrations.status` | `active`, `cancelled` |
| `community_memberships.status` | `pending`, `active`, `rejected`, `left` |
| `community_creation_requests.status` | `pending`, `approved`, `rejected` |

`community_memberships` tiene estas columnas de relación y auditoría:

```text
id, community_id, user_id, community_role_id, status,
requested_at, reviewed_at, reviewed_by, created_at, updated_at
```

Un registro `active` representa la pertenencia. El rol `organizer` permite
crear, editar, cancelar y administrar imágenes de eventos; `tutor` solo
identifica al profesor tutor; `member` representa una participación normal.
Solo un `organizer` puede asignar o cambiar roles comunitarios. La aplicación
debe conservar al menos un organizador activo por comunidad.

## Relaciones

```text
users ──< community_memberships >── communities
community_memberships ──> community_roles
users (reviewed_by) ──< community_memberships
users (requested_by) ──< community_creation_requests
users (reviewed_by) ──< community_creation_requests
community_creation_requests ──> communities (nullable after approval)
communities ──< events ──< registrations >── users
```

No existen las tablas `roles`, `role_user` ni `community_organizers`. Tampoco
se usan `community_organizer_id` o `student_id`; las policies consultan la
membresía activa y las inscripciones usan `user_id`.

## Normalización e integridad

- No se guardan listas, JSON de miembros ni nombres duplicados en relaciones.
- Los datos de usuario, comunidad y rol viven en sus propias tablas; los estados
  inmutables se validan con enums de base de datos, enums PHP y traducciones
  españolas.
- La combinación `community_id + user_id` evita membresías duplicadas.
- Las FK usan `RESTRICT` para comunidades, usuarios, roles y eventos,
  preservando el historial. `reviewed_by` permite `NULL` y usa `SET NULL`.
- Los catálogos de eventos conservan `is_active`; desactivarlos no modifica
  eventos históricos.
- Las comunidades nuevas solo se crean al aprobar una propuesta administrativa.
  Una comunidad creada comienza con `is_active = TRUE` y el solicitante recibe
  la membresía `active/organizer`.
- Las imágenes usan el disco público del backend: `community-requests/` es
  temporal y `communities/` es la ubicación definitiva. La base guarda solo
  `image_path` y la API expone `image_url`.
- La capacidad disponible se calcula desde las inscripciones activas y no se
  almacena como dato redundante.

## Seeds

`CommunityReferenceSeeder` crea los roles comunitarios. Los códigos y etiquetas
de estados los proporcionan los enums y `lang/es/statuses.php`. Los seeds de demostración crean un usuario con
membresía `organizer`, otro con membresía `member`, una comunidad, una
propuesta pendiente, un evento y una inscripción. `AdminSeeder` establece
`users.is_admin = true` para `admin@espol.edu.ec`.

## Reinicio local

El esquema no se ha desplegado y no requiere migración de datos. Para recrear
la base local:

```bash
php artisan migrate:fresh --seed
```

El comando es destructivo y debe ejecutarse únicamente sobre la base local de
PoliLink.

## Fuentes

- `docs/CONTEXT/PROJECT_CONTEXT.md`
- `docs/api/API.md`
- `backend/database/migrations/`
