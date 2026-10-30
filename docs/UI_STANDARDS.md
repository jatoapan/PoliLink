# PoliLink UI Standards

Guía de estándares para diseñar y construir las vistas de PoliLink. Define
decisiones de navegación, contenido, formularios, estados y protección de
datos para mantener una experiencia consistente mientras se implementa la
gestión de eventos del organizador.

## 1. Principios del producto

- Diseñar alrededor de una tarea concreta. Cada pantalla debe explicar qué
  puede hacer el usuario, por qué importa y cuál es el siguiente paso.
- Mantener una sola acción primaria por pantalla. Las demás acciones deben
  tener menor énfasis o aparecer dentro de un menú contextual.
- Mostrar solo la información necesaria para completar la tarea. Dividir
  formularios largos en pasos lógicos y mostrar el progreso.
- Preservar la información ingresada. Un error, una navegación accidental o
  una respuesta `422` no debe obligar a llenar el formulario nuevamente.
- Mantener el lenguaje visible en español. Los nombres de componentes, hooks,
  variables, tipos y servicios permanecen en inglés.
- Mantener el lenguaje visual definido en `frontend/DESIGN.md`: fondo cálido,
  bordes sutiles, jerarquía tipográfica clara y componentes shadcn/Radix.

## 2. Estructura de una pantalla

Las páginas de tareas deben seguir este orden:

1. Enlace de retorno o breadcrumb en la parte superior, cerca del título.
2. Contexto breve o eyebrow de la sección.
3. Un `h1` específico de la tarea, no un título genérico del módulo.
4. Descripción corta que explique el resultado esperado.
5. Alertas globales o estado de la página.
6. Contenido principal dentro de una tarjeta o sección claramente delimitada.
7. Acciones al final del contenido.

El onboarding de comunidades es el patrón de referencia: explica el objetivo,
separa la creación del historial de solicitudes, muestra el progreso y usa una
revisión antes del envío. La pantalla de revisión debe confirmar los datos y la
representación de la comunidad; no debe volver a preguntar si el usuario desea
crear la comunidad.

## 3. Navegación y acciones

### Enlaces y botones

- Usar un enlace (`Link`) cuando la intención es navegar a otra URL.
- Usar un botón (`Button`) cuando la intención es modificar datos, abrir un
  diálogo, enviar un formulario, cancelar un evento o cambiar el estado de la
  vista.
- No usar un botón con apariencia de acción primaria para cada enlace de la
  página.
- Los botones solo con ícono requieren `aria-label` y tooltip; si el texto es
  importante, usar texto visible.
- Los íconos deben reforzar el significado del texto: flecha hacia la derecha
  para continuar y hacia la izquierda para volver.

### Significado de las acciones

| Texto visible | Significado en PoliLink |
| --- | --- |
| `Volver a organizar` | Sale del flujo actual y regresa a `/organizar`. Protege cambios pendientes. |
| `Atrás` / `Editar información` | Regresa al paso anterior y conserva los datos ingresados. |
| `Cancelar` | Abandona la tarea completa y vuelve a su origen. No significa “paso anterior”. |
| `Revisar información` | Avanza al paso de revisión sin enviar datos al backend. |
| `Enviar solicitud` / `Publicar evento` | Acción primaria final que persiste información. |
| `Guardar cambios` | Persiste una edición válida y muestra confirmación. |
| `Cancelar evento` | Acción destructiva que conserva el registro, pero cambia su estado. Requiere confirmación. |

No mostrar `Atrás` y `Cancelar` si ambos llevan al mismo destino. Si una acción
puede perder información, su etiqueta debe describir la consecuencia, por
ejemplo `Salir sin guardar` dentro del diálogo de confirmación.

### Colocación

- En páginas dedicadas, colocar el grupo de acciones al final del formulario;
  no fijarlo en la parte superior.
- En flujos de varios pasos, colocar `Atrás` o la acción secundaria a la
  izquierda y la acción primaria (`Continuar`, `Revisar`, `Enviar`) a la
  derecha.
- En móvil, apilar los botones y hacer que la acción primaria sea la última y
  más fácil de alcanzar.
- En diálogos y paneles laterales, usar un footer consistente y acciones de
  ancho completo cuando el espacio sea reducido.
- En una tabla o tarjeta, mantener visibles las acciones frecuentes y agrupar
  las acciones secundarias en un menú de desbordamiento.

## 4. Subfases de la experiencia del organizador

Estas subfases cubren la responsabilidad de Gabriel: crear, editar y cancelar
eventos. Son una separación de implementación; no cambian el contrato de la
API.

| Subfase | Vista propuesta | Contenido y acción primaria | Salida |
| --- | --- | --- | --- |
| 3.3 Panel de eventos | `/mis-eventos` | Historial paginado, estado, cupos, comunidad e imagen. Incluye acciones para editar o cancelar eventos publicados. | El organizador revisa su historial y encuentra acciones coherentes con el estado del evento. |
| 3.4 Crear evento | `/crear-evento` | Formulario agrupado: información, fecha/hora, modalidad/ubicación, comunidad, cupos e imagen. `Publicar evento`. | Evento creado y visible en el panel y catálogo público. |
| 3.5 Editar evento | `/eventos/:eventId/editar` | Reutiliza el formulario, precarga datos y conserva valores cuando falla la validación. `Guardar cambios`. | Evento activo actualizado. |
| 3.6 Imagen | Dentro de crear/editar | Preview, reemplazo inmediato y eliminación confirmada; formato, tamaño y estado de carga visibles. | `image_url` se refleja sin romper el resto del formulario. |
| 3.7 Cancelar y estabilizar | Panel y detalle | `Cancelar evento`, confirmación con consecuencia clara, bloqueo durante envío, estados `409`, `403`, `422` y reintentos. | Evento cancelado sin eliminarse; falta la verificación contra servicios locales. |

El panel debe separar eventos publicados y cancelados mediante filtros o
secciones claras. Un estado vacío debe explicar qué falta y ofrecer `Crear
evento`; una lista no debe quedar reducida a una pantalla en blanco.

## 5. Estándar de formularios

- Usar React Hook Form + Zod. Derivar el tipo desde el schema y declarar
  `defaultValues` para todos los campos.
- Usar validación `onTouched` o al avanzar/enviar; evitar mensajes agresivos
  mientras la persona todavía está escribiendo.
- Cada control debe tener un label visible asociado mediante `htmlFor`/`id`.
  El placeholder es un ejemplo, nunca el único label.
- Indicar campos opcionales junto al label y no depender únicamente del color
  para marcar campos requeridos.
- Asociar instrucciones y errores mediante `aria-describedby`. Mostrar errores
  junto al campo y un resumen global cuando el envío falle; mover el foco al
  resumen o al primer error.
- Usar `noValidate` para que Zod controle los mensajes. Los errores del backend
  deben mapearse a los campos sin borrar los valores ingresados.
- Deshabilitar controles durante el envío, mostrar progreso en el botón y
  evitar dobles envíos.
- Usar una columna por defecto. Dos columnas solo para campos cortos y
  relacionados, como fecha/hora; en móvil todo vuelve a una columna.
- Mantener los campos del evento alineados con el contrato: título,
  descripción, categoría, fecha, hora, ubicación, modalidad, cupos, comunidad
  e imagen opcional.

### Límites y contador de caracteres

- Definir el límite en el schema, reflejarlo en `maxLength` y mantener ambos
  valores sincronizados con la validación del backend.
- No limitar caracteres arbitrariamente: aceptar tildes, ñ, apóstrofes y otros
  caracteres válidos para nombres y descripciones.
- Usar contador visible en descripciones o campos largos cuando el límite
  afecta la redacción. Ejemplo: `128 de 500 caracteres`.
- Si se supera el límite, explicar cuánto se permite y cómo corregirlo; no
  truncar silenciosamente texto escrito por el usuario.
- Para teléfonos, cupos y otros valores estructurados, normalizar solo lo
  necesario y mostrar el formato esperado antes de enviar.

## 6. Protección de cambios sin guardar

Todo formulario que pueda abandonarse debe considerar como dirty cualquier
cambio de texto, selector, checkbox o archivo. La protección tiene dos capas:

1. **Navegación dentro de la SPA:** usar un guard basado en React Router
   (`useBlocker`) y mostrar un `AlertDialog` propio con `Continuar editando` y
   `Salir sin guardar`.
2. **Recarga, cierre de pestaña o navegación externa:** registrar
   `beforeunload` únicamente mientras existan cambios pendientes. El navegador
   muestra un mensaje genérico; el listener debe eliminarse al guardar o
   restaurar los valores iniciales.

El patrón de `useUnsavedGuard` revisado en `bopacorp-crm` es la referencia para
diálogos y sheets: mantiene el estado dirty en un ref, recuerda la acción
pendiente y reutiliza un diálogo de descarte. En PoliLink debe complementarse
con el guard de rutas, porque un hook que solo intercepta `close` y `back` no
cubre enlaces, navegación del router ni recarga.

Reglas adicionales:

- `Volver`, logo, menú, breadcrumb, `Cancelar` y botón de cierre deben pasar
  por el mismo guard.
- Después de un envío exitoso, limpiar el estado dirty antes de navegar.
- Después de un `422`, mantener el formulario abierto, conservar los valores y
  enfocar los errores.
- Mientras se envía una mutación, no permitir abandonar mediante otra acción
  que pueda producir una segunda solicitud.
- No implementar autosave implícito en esta fase; sería un flujo distinto que
  requiere contrato y decisiones de producto.

## 7. Estados y contenido de feedback

Cada vista debe diseñar explícitamente estos estados:

- **Carga:** skeleton que conserve la estructura de la pantalla.
- **Vacío:** explicar por qué no hay datos y ofrecer una acción útil.
- **Error:** mensaje en español, causa comprensible, botón `Reintentar` cuando
  corresponda y no borrar contenido local.
- **Éxito:** confirmación breve y siguiente paso claro; usar toast solo para
  confirmaciones no críticas.
- **Autorización:** distinguir sesión expirada (`401`), falta de permisos
  (`403`), recurso inexistente (`404`), conflicto (`409`) y validación (`422`).

Los mensajes deben describir el problema y la solución: `El título debe tener
entre 5 y 120 caracteres`, no `Error de validación` ni `Error 422`.

La gestión de errores de API se centraliza en `src/shared/errors/` y
`src/shared/ui/api-error-feedback.tsx`. Las vistas deben usar el resolver y el
componente compartidos para errores genéricos de red, sesión, permisos,
servidor y errores desconocidos. Los mensajes crudos del backend no se
renderizan directamente. Una feature puede sobrescribir el mensaje solo
cuando el contexto cambie la acción, por ejemplo `404` para evento no
encontrado, `422` para filtros inválidos o `403` para una sección de
organización. Los errores de campos se muestran junto al control y se aplican
mediante el helper compartido de formularios.

## 8. Accesibilidad y responsive

- Garantizar navegación completa con teclado y un foco visible en controles.
- Mantener contraste suficiente en light y dark mode; no comunicar estados solo
  con color o íconos.
- Usar headings en orden, landmarks (`main`, `nav`) y diálogos con título,
  descripción y foco administrado.
- Las alertas dinámicas deben anunciarse de forma accesible sin robar el foco
  durante la escritura.
- En móvil, priorizar una columna, acciones apiladas, áreas táctiles cómodas y
  filtros dentro de un Sheet.
- Las previews de imágenes deben tener texto alternativo útil; los logos usan
  `object-contain` y las portadas de eventos deben indicar si son decorativas.

## 9. Checklist antes de cerrar una vista

- [ ] La pantalla tiene un objetivo y una acción primaria claros.
- [ ] La navegación usa enlaces y las mutaciones usan botones.
- [ ] `Atrás`, `Cancelar` y `Volver` tienen destinos y consecuencias distintos.
- [ ] El formulario tiene labels, instrucciones, límites y errores accesibles.
- [ ] Los límites del cliente coinciden con Zod y el backend.
- [ ] Se preservan los valores después de errores.
- [ ] El guard protege navegación, cierre, recarga y cambios de paso.
- [ ] Existen estados de carga, vacío, error y éxito.
- [ ] La vista funciona en light/dark mode, teclado y móvil.
- [ ] La salida se puede verificar con sesión real y datos persistidos.

## Referencias

- [W3C WAI Forms Tutorial](https://www.w3.org/WAI/tutorials/forms/)
- [W3C WAI User Notifications](https://www.w3.org/WAI/tutorials/forms/notifications/)
- [React Router `useBlocker`](https://reactrouter.com/api/hooks/useBlocker)
- [MDN `beforeunload`](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event)
- [GOV.UK Back link](https://design-system.service.gov.uk/components/back-link/)
- [GOV.UK Character count](https://design-system.service.gov.uk/components/character-count/)
- [GOV.UK Error message](https://design-system.service.gov.uk/components/error-message/)
- [Carbon Design System: Form usage](https://carbondesignsystem.com/components/form/usage/)
- [Carbon Design System: Button usage](https://carbondesignsystem.com/components/button/usage/)
