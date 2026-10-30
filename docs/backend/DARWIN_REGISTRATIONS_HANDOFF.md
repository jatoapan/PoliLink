# Guía de contexto para el agente de Darwin Díaz

## Objetivo y responsabilidad

Darwin implementa la experiencia de inscripciones de PoliLink:

- Un usuario autenticado puede inscribirse y cancelar su propia inscripción.
- Después de cancelar, puede volver a inscribirse; esto reactiva la misma
  relación y libera o reserva un cupo correctamente.
- Un organizador puede consultar los inscritos y el resumen de cupos de los
  eventos de las comunidades que administra.
- Un usuario puede consultar sus inscripciones activas en `/mis-inscripciones`.

No existe un rol global `student`. Cualquier usuario autenticado puede
inscribirse. El permiso de consultar asistentes depende exclusivamente de una
membresía activa con rol `organizer` en la comunidad responsable del evento.

Gabriel mantiene el catálogo y la gestión del evento: crear, editar, cancelar
y administrar imágenes. No modificar esos flujos salvo para añadir un enlace
puntual hacia las inscripciones o los asistentes.

## Estado actual del codebase

El backend ya está implementado. No crear otra tabla, migración, modelo ni
controlador de inscripciones. La fuente de verdad es:

- `backend/app/Http/Controllers/RegistrationController.php`
- `backend/app/Http/Resources/RegistrationResource.php`
- `docs/api/API.md`

También existen las rutas Sanctum y la cobertura backend en
`backend/tests/Feature/RegistrationApiTest.php`. El frontend solo contiene
README de los módulos, por lo que el trabajo de Darwin es principalmente la
integración React.

## Contrato disponible

Todas las operaciones usan la cookie de sesión Sanctum. Nunca enviar
`user_id`, `student_id`, `organizer_id` ni un rol en el cuerpo.

| Método | Endpoint | Uso |
| --- | --- | --- |
| `POST` | `/events/{event}/registrations` | Inscribir o reactivar al usuario de sesión. |
| `DELETE` | `/events/{event}/registrations` | Cancelar la inscripción activa propia. |
| `GET` | `/events/{event}/registrations` | Listar asistentes activos y cupos; requiere organizer responsable. |
| `GET` | `/me/registrations?per_page=12` | Listar las inscripciones activas propias. |

Las solicitudes de inscripción y cancelación no reciben cuerpo. `POST`
responde `201` para una inscripción nueva y `200` al reactivar una cancelada.
`DELETE` responde `200`. La lista de asistentes devuelve `data` y `summary`
con `capacity`, `active_registrations` y `available_capacity`. Mis
inscripciones es una colección paginada e incluye el evento completo.

Reglas que la interfaz debe respetar:

- Un evento cancelado no acepta inscripciones y responde `409`.
- Un usuario inscrito nuevamente responde `409`.
- Un evento lleno responde `409`; mostrar `Cupos agotados`.
- Cancelar no borra la fila: cambia su estado y libera un cupo.
- Una lista de asistentes no autorizada responde `403`.
- Una inscripción inexistente o ya cancelada responde `404` al cancelar.

## Plan de implementación frontend

### 1. Base de API y modelos

Crear el módulo `frontend/src/features/registrations/` manteniendo separados
`student/` y `attendees/`.

- Definir schemas Zod para inscripción, usuario inscrito, evento anidado,
  paginación y resumen de cupos.
- Crear `registrationsApi` con métodos `register`, `cancel`, `myRegistrations`
  y `attendees`.
- Crear claves React Query separadas para detalle de inscripción, mis
  inscripciones, asistentes y resumen.
- Crear mutaciones que invaliden el detalle/catálogo del evento, el panel del
  organizador y las listas relacionadas después de registrar o cancelar.
- Reutilizar `request`, `ApiError` y `ApiErrorFeedback`; no crear otro cliente
  HTTP ni duplicar el manejo genérico de errores.

### 2. Inscripción desde el detalle del evento

Integrar una sección de acción en `EventDetailPage`:

- Usuario anónimo: mostrar `Inicia sesión para inscribirte` y conservar el
  destino de regreso al evento.
- Usuario autenticado: mostrar `Inscribirme` cuando el evento esté publicado y
  tenga cupos.
- Mientras se envía: deshabilitar el botón y mostrar `Inscribiendo…`.
- Éxito: mostrar confirmación, actualizar cupos y cambiar la acción a la
  opción de cancelar la inscripción.
- Evento lleno: deshabilitar la inscripción sin intentar enviar la solicitud.
- Evento cancelado: mostrar el estado informativo sin acciones de inscripción.
- `409`, `401`, `404` y `422`: usar mensajes en español y conservar la vista.

La respuesta `409` del backend es la autoridad para duplicados, capacidad y
estado del evento. No inventar un endpoint de “mi inscripción por evento”.
Cuando sea necesario conocer inscripciones activas, usar la colección
`/me/registrations` y mantener el estado de la mutación como fuente inmediata.

### 3. Pantalla `/mis-inscripciones`

Añadir una ruta protegida y una entrada de navegación para usuarios
autenticados.

- Mostrar tarjetas con evento, comunidad, fecha, modalidad, ubicación, imagen
  y cupos disponibles.
- Consumir paginación del backend y conservar `page` en la URL.
- Estado vacío: explicar que todavía no hay inscripciones y enlazar a
  `/eventos`.
- Añadir `Cancelar inscripción` con diálogo de confirmación.
- Después de cancelar, retirar la tarjeta de la lista activa, actualizar los
  cupos del evento y mostrar una confirmación breve.
- Mantener la opción de volver al detalle para reactivar la inscripción con
  `POST`.

### 4. Vista de asistentes y cupos

Crear una ruta protegida `/eventos/:eventId/inscritos` y enlazarla desde las
tarjetas de `/mis-eventos` para los eventos administrados.

- Consumir `GET /events/{event}/registrations` sin enviar un usuario ni rol.
- Mostrar el resumen de capacidad en la parte superior.
- Mostrar nombre, apellido, correo, fecha de inscripción y estado activo.
- Diseñar tabla para escritorio y tarjetas apiladas para móvil.
- Cubrir carga, vacío, error, `403`, `404` y evento sin inscritos.
- Si el backend responde `403`, explicar que solo el organizador responsable
  puede consultar la lista; no ocultar el error como si no hubiera datos.

No agregar acciones para editar, cancelar eventos o modificar asistentes.
Esta vista es de consulta.

### 5. Integración y entrega

- Mantener rutas visibles y textos en español; nombres de código en inglés.
- Usar `Dialog` de shadcn/Radix para cancelaciones destructivas.
- Aplicar los estados de carga, vacío, error y éxito definidos en
  `docs/UI_STANDARDS.md`.
- Actualizar los README del módulo y la documentación de fases cuando el
  flujo esté integrado.
- Verificar los recorridos con sesión real en el orden: login, inscripción,
  cancelación, reactivación, mis inscripciones y asistentes.

## Límites

No añadir pagos, correos, calendario, QR, asistencia, integraciones
institucionales, aprobación de eventos ni roles globales de estudiante. No
cambiar el contrato backend existente sin documentar primero una necesidad
real y coordinarla con Gabriel.
