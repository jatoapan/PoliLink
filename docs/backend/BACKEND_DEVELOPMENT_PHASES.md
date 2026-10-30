# Fases de desarrollo del backend de PoliLink

**Estado:** base funcional, directorio público, membresías propias y
aprobación administrativa de comunidades implementados.

El backend usa Laravel, MySQL y sesiones Sanctum. Los organizadores publican,
editan y cancelan eventos directamente; no existe aprobación administrativa de
eventos. La autenticación institucional y otras integraciones permanecen fuera
del alcance.

## Estado implementado

1. **Persistencia limpia:** `users.is_admin`, comunidades, roles comunitarios,
   enums de estado, eventos, catálogos e inscripciones.
2. **Modelo de pertenencia:** `community_memberships` relaciona un usuario con
   una comunidad y un rol principal: `member`, `organizer` o `tutor`.
3. **Eventos:** `events.community_id` identifica la comunidad; solo una
   membresía `active/organizer` puede crear, editar, cancelar o administrar
   imágenes.
4. **Inscripciones:** `registrations.user_id` permite a cualquier usuario
   autenticado inscribirse, cancelar y reactivar su registro sin duplicados ni
   sobrecupo.
5. **Administración global:** `users.is_admin` protege exclusivamente el
   catálogo de categorías, modalidades y ubicaciones.
6. **Calidad:** migraciones, seeders, policies, resources y pruebas feature
   están alineados con el esquema nuevo.
7. **Directorio público:** búsqueda paginada y perfil público de comunidades;
   los eventos se consultan mediante el filtro público existente.
8. **Membresías propias:** solicitudes `pending/member`, cancelación,
   reactivación y consulta paginada de todos los estados.
9. **Propuestas de comunidades:** solicitud autenticada, revisión administrativa,
   comunidad activa y promoción automática del solicitante a `organizer`.
10. **Imágenes de comunidades:** logo opcional en la propuesta, movimiento al
    filesystem definitivo al aprobar y reemplazo/eliminación por el organizador.

## Próximas fases

### Fase A — Directorio de comunidades

**Estado:** implementada en backend.

- `GET /communities/discover` busca por nombre y devuelve todas las comunidades
  con paginación.
- `GET /communities/{community:slug}` devuelve únicamente la información
  pública de la comunidad y resuelve el perfil mediante `slug`.
- Los eventos del perfil se cargan con `GET /events?community_id={id}`.
- `GET /communities` conserva su propósito de alimentar filtros con
  comunidades que tienen eventos publicados.

Los recursos de comunidad incluyen `id`, `name`, `slug`, `description` e
`image_url`. El frontend usa `slug` para la URL pública y conserva el `id` para
`community_id`, membresías y administración de imágenes.

### Fase B — Solicitudes de membresía

**Estado:** implementada en backend.

- `POST /communities/{community}/membership-requests` crea o reactiva la
  solicitud propia como `pending/member`.
- `DELETE /communities/{community}/membership-requests` cambia la solicitud o
  membresía propia a `left`, excepto para organizers activos.
- `GET /me/memberships` lista todos los estados de membresía propios con
  paginación.
- El cliente no puede asignar roles ni estados.

### Fase C — Aprobación comunitaria

La aprobación de solicitudes de membresía por `organizer` permanece pendiente.
La aprobación administrativa de nuevas comunidades ya está implementada con
`community_creation_requests`; este flujo no aprueba eventos.

### Fase D — Integración frontend

Conectar `/comunidades`, perfiles, solicitudes, `/mis-comunidades` y la bandeja
de organizador con los contratos backend aprobados.

### Fase E — Propuestas de nuevas comunidades

**Estado:** implementada en backend.

- `POST /community-creation-requests` recibe nombre, descripción e imagen
  opcional, genera el `slug` y deja la propuesta en `pending`. El cliente no
  envía el slug.
- `admin` lista, aprueba o rechaza propuestas; el rechazo exige razón.
- La aprobación crea una comunidad activa y una membresía `active/organizer`
  para el solicitante, conservando el slug de la solicitud.
- La imagen temporal se mueve de `community-requests/` a `communities/`.
- No existe todavía un endpoint para desactivar comunidades ni validación
  institucional de pertenencia.

## Validación de entrega

Desde `backend/`:

```bash
php artisan migrate:fresh --seed
php artisan test
vendor/bin/pint --test
```

Los agentes no inician ni detienen MySQL, Laravel o Vite. La verificación
navegador → Laravel → MySQL debe registrarse como evidencia separada.
