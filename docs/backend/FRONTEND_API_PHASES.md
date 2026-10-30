# Fases de integración del frontend de PoliLink

**Estado:** integración incremental; las Fases 1, 2 y la experiencia del
organizador de la Fase 3 están implementadas en código. La verificación con
servicios locales sigue pendiente; las inscripciones y asistentes pertenecen a
Darwin y a las fases posteriores.
**Documento canónico:** este archivo describe el estado y el trabajo restante
para conectar React con la API Laravel. Los detalles exactos de cuerpos,
respuestas y códigos HTTP se mantienen en [`docs/api/API.md`](../api/API.md).

## Línea base actual

- El backend tiene en código autenticación local con Sanctum, comunidades,
  catálogo, gestión de eventos e inscripciones.
- El frontend ya tiene router, shell visual, cliente HTTP, estado de sesión y
  una primera experiencia de autenticación en `frontend/src/features/auth/`.
- Existen las rutas `/iniciar-sesion` y `/registrarse`, formularios con React Hook Form y
  Zod, redirecciones internas seguras, manejo de errores de Laravel, logout y
  menú de usuario según sesión/rol.
- La Fase 2 ya integra en código el catálogo público, búsqueda con debounce,
  filtros URL-backed, datos de referencia, paginación numerada y detalle de
  evento en `/eventos` y `/eventos/:eventId`. La ruta `/` conserva la landing.
- La integración frontend del organizador para comunidades y eventos está
  implementada en código, incluyendo creación, edición, imágenes y
  cancelación. Las inscripciones, asistentes y todos sus estados todavía no
  están integrados en el frontend.
- La verificación en ambiente real con MySQL, Laravel y Vite debe registrarse
  por separado; la existencia de código o documentación no la reemplaza.
- Por lo tanto, las fases pendientes corresponden principalmente a la
  verificación real del organizador y a los recorridos de Darwin; una API
  marcada como implementada no significa que la experiencia React esté
  verificada en runtime.
- Las rutas visibles del navegador usan español; los nombres de código se
  mantienen en inglés. Los endpoints `/api/...` conservan el contrato backend.

## Contrato de comunidades para el frontend

El backend devuelve `id` y `slug` en todos los recursos de comunidad. No son
intercambiables: el `slug` identifica perfiles públicos y el `id` continúa
identificando relaciones y operaciones autenticadas.

| Caso de uso | Endpoint | Identificador |
| --- | --- | --- |
| Listado para filtros del catálogo | `GET /communities` | La respuesta incluye `id` y `slug`. |
| Directorio y búsqueda | `GET /communities/discover?search=...` | La respuesta incluye `id` y `slug`. |
| Perfil público | `GET /communities/{slug}` | Sustituir `{slug}` por el valor recibido; la declaración backend es `{community:slug}`. |
| Eventos de una comunidad | `GET /events?community_id={id}` | Usar el `id` numérico. |
| Solicitud de membresía | `/communities/{id}/membership-requests` | Usar el `id` numérico. |
| Logo de una comunidad | `/communities/{id}/image` | Usar el `id` numérico. |

El recurso público de comunidad tiene esta forma:

```ts
type Community = {
  id: number
  name: string
  slug: string
  description: string | null
  image_url: string | null
}
```

Para crear una comunidad, el frontend debe reemplazar cualquier uso del
endpoint antiguo `POST /communities` por
`POST /community-creation-requests`. El cuerpo acepta `name`,
`description` e `image` opcional; no se envían `slug`, `status`, `requested_by`
ni roles. El backend genera el slug y responde con una propuesta `pending`.
Sin imagen se puede enviar JSON; cuando se adjunta un archivo real, el
frontend debe usar `multipart/form-data` y no serializar el `File` como JSON:

```ts
const formData = new FormData()
formData.append('name', 'Club de Robótica')
formData.append('description', 'Comunidad de robótica de ESPOL.')
formData.append('image', selectedFile)

await request('/community-creation-requests', {
  method: 'POST',
  body: formData,
})
```

El cliente HTTP no debe fijar manualmente `Content-Type` al enviar
`FormData`; el navegador agrega el boundary multipart. Si no se selecciona
imagen, el payload JSON equivalente es:

```json
{
  "name": "Club de Robótica",
  "description": "Comunidad de robótica de ESPOL."
}
```

La respuesta contiene `id`, `name`, `slug`, `description`, `image_url` y
`status`. En las consultas de propuestas procesadas, el objeto anidado
`community` contiene el mismo `slug` que debe usarse para el perfil público.
El frontend debe actualizar sus esquemas Zod, tipos, mocks, enlaces y claves
de caché para conservar ambos identificadores.

## Responsabilidades

| Área | Responsable principal |
| --- | --- |
| Catálogo, búsqueda, filtros y detalle de eventos | Gabriel Tumbaco |
| Crear, editar y cancelar eventos desde el organizador | Gabriel Tumbaco |
| Inscribirse, cancelar/reactivar y consultar mis inscripciones | Darwin Díaz |
| Consultar inscritos y cupos disponibles | Darwin Díaz |
| Autenticación, shell visual, API client, estados comunes y evidencia | Compartida |

Cada integrante debe cubrir su flujo tanto en frontend como en backend. La API
ya incluye aprobación administrativa de propuestas de comunidades, pero su
panel frontend queda para una fase separada. No se añaden autenticación
institucional, pagos, correo, calendario, códigos QR ni validación de
asistencia.

Las tablas internas no generan pantallas CRUD generales. El backend ya expone
un panel futuro para que `is_admin` mantenga categorías, modalidades y
ubicaciones; los estados inmutables se entregan como códigos y etiquetas
españolas desde enums del backend, mientras roles comunitarios y relaciones de
membresía permanecen controlados por el backend. La interfaz de administración se implementará en
una fase separada. El backend también expone la revisión administrativa de
propuestas de comunidades; no se trata de un CRUD general de usuarios o
membresías.

## Fases generales

### Fase 0 — Línea base y contrato

Documentar la estructura actual, agrupar las APIs existentes por experiencia,
confirmar responsables y registrar dependencias. Esta fase evita marcar como
terminada una API cuando aún no existe una pantalla integrada.

### Fase 1 — Fundación compartida y sesión

**Estado actual:** `Implemented` para la interfaz y la integración preparada;
`Verified` queda pendiente para la ejecución navegador → Laravel.

Ya están implementados el cliente con cookies y CSRF, errores tipados, estado de
sesión, mutaciones de login/registro/logout, guards reutilizables, las pantallas
`/iniciar-sesion` y `/registrarse`, validación de correos `@espol.edu.ec`, confirmación de
contraseña, redirecciones internas seguras y el menú de sesión del encabezado.
La prueba con MySQL, Laravel y Vite debe registrarse por separado;
la existencia de estos componentes no la reemplaza.

La navegación hacia las pantallas protegidas de catálogo, organizador e
inscripciones se completará en las fases de sus respectivos dominios.

La fundación de la SPA cubre la estructura general, navegación, estilos
compartidos, cliente HTTP, sesión Sanctum, registro/login/logout, administración
global, membresías comunitarias y manejo común de carga, errores y sesión
expirada. La verificación de estos
recorridos con los servicios locales queda pendiente.

### Fase 2 — Descubrimiento público

**Estado actual:** `Implemented` en código; `Verified` queda pendiente de
ejecutar React → Laravel con los servicios locales.

La landing se conserva en `/` y el catálogo público se encuentra en `/eventos`.
La integración consume el contrato existente de `GET /events`,
`GET /events/{event}`, categorías, modalidades y comunidades. Incluye búsqueda
con debounce de 300 ms, filtros por fecha/categoría/modalidad/comunidad
persistidos en la URL, paginación numerada, tarjetas enlazadas al detalle,
formateo local de fechas `es-EC`, cupos visibles y estados de carga, error y
catálogo vacío. En móvil los filtros se muestran en un Sheet de shadcn; en
escritorio se muestran como controles inline.

Esta fase es deliberadamente de solo lectura. La inscripción y la cancelación
de inscripciones quedan para la Fase 4. La publicación de eventos pertenece a
la Fase 3 y ya está implementada en el recorrido del organizador. No fueron
necesarios cambios funcionales adicionales en el backend para implementar este
alcance;
debe verificarse que el contrato y los datos sembrados estén disponibles en el
ambiente local.

### Fase 3 — Experiencia del organizador

**Contrato backend:** `Implemented`; **integración frontend del organizador:**
`Implemented`; **verificación real:** `Pending`.

El contrato de esta fase está cerrado en `docs/api/API.md`: onboarding de
comunidades, comunidades administradas, eventos propios paginados, creación
multipart con imagen opcional, edición parcial, reemplazo/eliminación de
imagen y cancelación. El backend aplica la relación
`community_memberships` con rol `organizer`, acepta únicamente catálogos activos
para altas y
ediciones, conserva eventos cancelados en el dashboard y devuelve
`image_url` nullable.

La implementación frontend se organiza en subfases verticales. Cada una dejó
un recorrido pequeño y automatizado; la verificación completa del conjunto
todavía requiere ejecutar los servicios locales. La creación de comunidades
consume solicitudes pendientes; no crea la comunidad directamente.

#### Fase 3.1 — Fundación del organizador

**Estado:** implementada en código; `Verified` queda pendiente de la
verificación navegador → Laravel.

- Las rutas protegidas `/organizar`, `/crear-comunidad`, `/mis-solicitudes` y
  `/mis-comunidades` están disponibles, con `/organizador` como redirección
  heredada.
- El cliente API de comunidades, las claves de consulta y los estados comunes
  de carga, sesión expirada y error están integrados.

**Salida:** el usuario autenticado puede entrar al área correcta del
organizador.

#### Fase 3.2 — Comunidades

**Estado:** implementada en código; `Verified` queda pendiente de la
verificación navegador → Laravel.

- Consume `GET /me/communities` y muestra las comunidades administradas.
- El panel separado `/mis-comunidades` incluye estado vacío y enlace hacia el
  onboarding.
- El onboarding de dos pasos en `/crear-comunidad` consume
  `POST /community-creation-requests`, valida los datos, acepta una imagen
  opcional y confirma el envío antes de redirigir a `/mis-solicitudes`.
- `/mis-solicitudes` lista, pagina y muestra el estado de las solicitudes
  propias como una vista independiente.
- El modelo conserva `slug` y los enlaces públicos usan
  `/comunidades/:slug`; el `id` no se usa en la URL pública.
- El `id` numérico se conserva para membresías, imágenes, filtros y
  `community_id` de eventos.
- El estado de la propuesta se muestra y la navegación se actualiza después de
  la aprobación administrativa, cuando el solicitante obtiene una membresía
  `active/organizer`.
- El landing, el catálogo y la navegación autenticada incluyen puntos de
  descubrimiento para organizar.
- Mostrar la opción de comunidad existente como capacidad futura, sin
  inventar un endpoint de búsqueda o representación.

**Salida:** un estudiante autenticado entiende cómo participar, envía una
propuesta mediante un recorrido guiado y llega a un panel separado cuando la
propuesta queda aprobada.

#### Fase 3.3 — Panel de eventos

**Estado:** implementada en código; verificación navegador → Laravel → MySQL
queda pendiente.

- Consumir `GET /me/events` con paginación.
- Mostrar eventos propios, estados `published`/`cancelled`, cupos, comunidad e
  imagen.
- Cubrir estados de carga, vacío, error y paginación.

**Salida:** el organizador puede revisar su historial de eventos.

#### Fase 3.4 — Crear evento

**Estado:** implementada en código; verificación navegador → Laravel → MySQL
queda pendiente.

- Crear el formulario con React Hook Form y Zod.
- Cargar categorías, modalidades, ubicaciones y comunidades administradas.
- Enviar `multipart/form-data` con imagen opcional y mostrar errores `422`.
- Invalidar o actualizar la lista después de publicar.

**Salida:** el organizador puede publicar un evento completo.

#### Fase 3.5 — Editar evento

**Estado:** implementada en código; verificación navegador → Laravel → MySQL
queda pendiente.

- Reutilizar el formulario para editar mediante `PATCH /events/{event}`.
- Permitir cambios de comunidad únicamente entre comunidades administradas.
- Precargar título, descripción, catálogos, comunidad, fecha, hora, modalidad,
  ubicación y cupos; convertir `starts_at` desde UTC a la zona horaria de
  ESPOL antes de mostrarlo.
- Enviar el conjunto editable como JSON, sin incluir `image`; la imagen actual
  se gestiona por separado mediante los endpoints de imagen de la Fase 3.6.
- Exponer `Editar evento` solo para eventos publicados, bloquear visualmente
  eventos cancelados y manejar respuestas `401`, `403`, `404`, `409` y `422`.
- Invalidar el panel del organizador y el detalle público después de guardar,
  mostrar confirmación y proteger cambios pendientes durante la navegación.

**Salida:** el organizador puede corregir eventos activos.

#### Fase 3.6 — Gestión de imágenes

**Estado:** implementada en código y cubierta por pruebas automatizadas;
verificación navegador → Laravel → MySQL queda pendiente.

- Mostrar la imagen actual o un fallback y permitir reemplazarla desde el mismo
  formulario de edición.
- Ejecutar el reemplazo inmediatamente con `POST /events/{event}/image` y
  solicitar confirmación antes de `DELETE /events/{event}/image`.
- Validar formato y tamaño antes de enviar, exponer estados de subida o
  eliminación y centralizar los errores `403`, `409`, `422` y de red.
- Actualizar el detalle, el catálogo y el historial del organizador sin volver
  a enviar los campos del evento.

**Salida:** el organizador puede administrar la portada sin afectar el resto
del formulario; falta comprobar la persistencia con servicios locales.

#### Fase 3.7 — Cancelación y estabilización

**Estado:** implementada en código y cubierta por pruebas automatizadas;
verificación navegador → Laravel → MySQL queda pendiente.

- Confirmar la consecuencia antes de enviar el `PATCH` sin cuerpo.
- Reflejar el estado cancelado sin eliminar el evento ni mostrar acciones de
  edición o cancelación.
- Cubrir estados de carga, doble envío, permisos `403`, conflictos `409`,
  validaciones `422` y errores de red con reintento.
- Registrar la evidencia de ejecución real cuando los servicios locales estén
  activos.

**Salida:** la experiencia del organizador queda verificada y lista para la
fase de inscripciones del estudiante después de completar la verificación real.

#### Checklist de verificación real del organizador

Este checklist es la condición para cambiar las fases 3.3–3.7 de `Pending` a
`Verified`. Las pruebas automatizadas no sustituyen estos pasos.

- [ ] Iniciar MySQL, Laravel y Vite según los README del repositorio.
- [ ] Ejecutar `php artisan migrate:fresh --seed` y `php artisan storage:link`.
- [ ] Iniciar sesión con un usuario que tenga una membresía activa con rol
  `organizer`.
- [ ] Abrir `/mis-eventos` y confirmar carga, paginación, imagen, cupos y
  estados `Publicado`/`Cancelado`.
- [ ] Crear un evento sin imagen y otro con imagen; comprobar que ambos
  aparecen en el historial y en `/eventos`.
- [ ] Editar un evento publicado y confirmar que la fecha se presenta en la
  zona horaria de ESPOL y que el `PATCH` no incluye `image`.
- [ ] Reemplazar la portada, confirmar el preview actualizado y comprobar la
  persistencia en el detalle público y el historial.
- [ ] Eliminar la portada, confirmar el diálogo y comprobar el fallback de
  imagen después de recargar.
- [ ] Cancelar un evento, confirmar que desaparece del catálogo público y que
  permanece en el historial sin acciones de edición o cancelación.
- [ ] Confirmar manualmente los casos de sesión expirada, permisos, conflicto
  por evento cancelado, validación de imagen y error de red.
- [ ] Registrar fecha, usuario de prueba, comandos, resultado y capturas en
  `docs/BITACORA.md` antes de cambiar el estado a `Verified`.

### Fase 4 — Experiencia del estudiante

Integrar inscripción, cancelación, reactivación, disponibilidad de cupos y
consulta de inscripciones activas.

### Fase 5 — Inscritos y capacidad

Integrar la vista del organizador para consultar inscritos, resumen de cupos,
permisos y actualización coherente después de cada cambio.

### Fase 6 — Integración y entrega

Ejecutar los recorridos completos navegador → Laravel → MySQL, cubrir respuestas
`401`, `403`, `404`, `409` y `422`, registrar evidencia, actualizar README/API/
bitácora y revisar la propuesta LaTeX en Overleaf.

## Flujo futuro de comunidades y membresías

La propuesta [`COMMUNITY_MEMBERSHIP_FLOW.md`](COMMUNITY_MEMBERSHIP_FLOW.md)
documenta un flujo posterior para buscar comunidades, solicitar pertenencia y
permitir que sus organizadores aprueben o rechacen solicitudes. Está marcado
como `Planned` y requiere aprobación de alcance antes de añadir migraciones,
endpoints o pantallas.

Este flujo separa la pertenencia de la administración. No modifica la regla
vigente de que los eventos publicados son públicos ni introduce aprobación
administrativa de eventos.

## Plantilla para documentar cada fase

Cada fase detallada debe incluir objetivo, responsables, prerrequisitos, APIs,
pantallas y flujo, estados y errores, criterios de aceptación, evidencia
requerida y estado (`Planned`, `In progress`, `Implemented`, `Verified` o
`Blocked`). Los nombres de componentes, tipos, rutas internas y casos de
prueba se decidirán al comenzar la fase correspondiente.

## Definición de frontend completo

PoliLink podrá declararse completo cuando todos los flujos asignados funcionen
desde React con sesión real, persistencia en MySQL, autorización y estados de
interfaz correctos; los recorridos hayan sido verificados; y la documentación,
capturas y propuesta reflejen únicamente comportamiento comprobado.

## Referencias

- `docs/CONTEXT/PROJECT_CONTEXT.md`
- `docs/api/API.md`
- `docs/api/POSTMAN.md`
- `backend/routes/api.php`
