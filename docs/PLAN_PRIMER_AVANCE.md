# PoliLink — Plan del primer avance

> **Nota de seguimiento (16 de agosto de 2026):** este documento conserva el
> plan académico original y sus casillas no representan por sí solas el estado
> actual del repositorio. Para el estado técnico vigente consulta
> [`docs/backend/FRONTEND_API_PHASES.md`](backend/FRONTEND_API_PHASES.md) y
> [`docs/BITACORA.md`](BITACORA.md). La integración de Gabriel para catálogo,
> creación, edición, imágenes y cancelación de eventos está implementada en
> código y cuenta con pruebas automatizadas; la verificación completa en
> navegador contra Laravel y MySQL todavía está pendiente. La integración de
> inscripciones, cancelación/reactivación y asistentes de Darwin permanece
> separada de este cierre.

## 1. Propósito

Construir un primer incremento funcional de PoliLink, la plataforma web para publicar, consultar e inscribirse en eventos de comunidades estudiantiles de ESPOL.

Al finalizar este avance debe existir una aplicación ejecutable en local, conectada entre frontend, API y base de datos, con un flujo demostrable de principio a fin:

1. Un organizador crea un evento.
2. Un estudiante consulta el catálogo y filtra eventos.
3. El estudiante revisa el detalle y se inscribe.
4. El organizador consulta los inscritos y los cupos disponibles.

El avance debe concentrarse en las funcionalidades del alcance aprobado. No se implementarán integraciones con sistemas institucionales, pagos, códigos QR, correo ni calendario institucional.

## 2. Resultado esperado

Se entregará un prototipo funcional responsive con:

- Frontend en React + TypeScript.
- Backend en Laravel + PHP expuesto como API REST.
- Persistencia en MySQL.
- Datos de prueba para estudiantes, organizadores, comunidades y eventos.
- Validaciones de formularios y reglas básicas de negocio.
- Evidencia de pruebas de los endpoints y de los flujos principales.
- Instrucciones para instalar y ejecutar el proyecto.

## 3. Trabajo asignado

### Gabriel Tumbaco

- Implementar la creación de eventos.
- Implementar la edición de eventos.
- Implementar la cancelación de eventos.
- Implementar el catálogo de eventos.
- Implementar la búsqueda y los filtros por fecha, categoría, modalidad y comunidad organizadora.

### Darwin Díaz

- Implementar la inscripción a eventos.
- Implementar la cancelación de inscripción.
- Implementar la consulta de inscritos de un evento.
- Implementar la consulta de cupos disponibles.

### Trabajo compartido

- Acordar la estructura de datos y los contratos de la API antes de desarrollar.
- Configurar el proyecto y las variables de entorno.
- Integrar frontend, backend y base de datos.
- Revisar código mediante ramas o pull requests.
- Preparar datos de prueba, documentación y demostración.

## 4. Actividades técnicas

### 4.1. Preparación del entorno

- [ ] Crear o confirmar la estructura de los proyectos frontend y backend.
- [ ] Configurar React, TypeScript y el sistema de estilos elegido.
- [ ] Configurar Laravel y la API REST.
- [ ] Crear la base de datos MySQL y el archivo `.env` a partir de un ejemplo seguro.
- [ ] Configurar CORS y la URL base de la API.
- [ ] Agregar un README con los requisitos y comandos de ejecución.
- [ ] Definir una estrategia de ramas y commits para el trabajo colaborativo.

### 4.2. Modelo de datos

Como mínimo, se deben definir las siguientes entidades:

- `users`: nombre, correo, contraseña y rol (`student` u `organizer`).
- `communities`: nombre, descripción y responsable.
- `events`: título, descripción, categoría, fecha, hora, ubicación, modalidad, cupo, comunidad, estado y organizador.
- `registrations`: estudiante, evento, fecha de inscripción y restricción para evitar duplicados.

Reglas mínimas:

- Un evento pertenece a una comunidad y a un organizador.
- El cupo debe ser un entero mayor que cero.
- La fecha y hora del evento son obligatorias.
- Un estudiante no puede inscribirse dos veces en el mismo evento.
- No se permite superar el cupo máximo.
- Un estudiante puede cancelar su inscripción.
- La cancelación de un evento debe conservar el registro, cambiando su estado a `cancelled`.
- No se debe permitir la inscripción en eventos cancelados.
- El número de cupos disponibles se calcula como `cupo máximo - inscritos activos`.

El modelo debe implementarse mediante migraciones, relaciones, validaciones y datos semilla. No se deben depender de registros creados manualmente en la base de datos.

### 4.3. API REST

La API debe documentar sus rutas, parámetros, respuestas y códigos HTTP. Como base, se proponen las siguientes rutas:

| Método | Ruta | Propósito |
| --- | --- | --- |
| `GET` | `/api/events` | Listar eventos activos y aplicar filtros. |
| `GET` | `/api/events/{id}` | Consultar el detalle de un evento. |
| `POST` | `/api/events` | Crear un evento. |
| `PUT/PATCH` | `/api/events/{id}` | Editar un evento. |
| `PATCH` | `/api/events/{id}/cancel` | Cancelar un evento. |
| `GET` | `/api/events/{id}/registrations` | Consultar inscritos y cupos del evento. |
| `POST` | `/api/events/{id}/registrations` | Inscribir a un estudiante. |
| `DELETE` | `/api/events/{id}/registrations` | Cancelar una inscripción. |

La implementación debe incluir:

- Controladores separados por responsabilidad.
- Validación de solicitudes.
- Respuestas JSON consistentes.
- Códigos `2xx` para operaciones exitosas y `4xx` para errores de validación, permisos, duplicados o cupos agotados.
- Filtros opcionales combinables para fecha, categoría, modalidad y comunidad.
- Verificación de que el organizador solo gestione sus propios eventos y que el estudiante solo gestione sus propias inscripciones.

Para el primer avance se puede utilizar una sesión o usuario de prueba simplificado, siempre que el rol y el usuario actual estén claramente identificados. La autenticación institucional queda fuera del alcance.

### 4.4. Frontend

Implementar las siguientes vistas, tomando como referencia los bocetos de `docs/latex/main.tex` y las imágenes existentes:

1. **Catálogo de eventos**
   - Mostrar eventos activos.
   - Permitir búsqueda y filtros.
   - Mostrar título, categoría, fecha, modalidad, comunidad y cupos disponibles.
   - Mostrar estados de carga, lista vacía y error.

2. **Detalle de evento**
   - Mostrar toda la información del evento.
   - Mostrar cupos disponibles.
   - Permitir inscribirse o cancelar la inscripción.
   - Deshabilitar acciones cuando el evento esté cancelado o lleno.

3. **Panel del organizador**
   - Listar sus eventos.
   - Mostrar inscritos y cupos.
   - Permitir editar y cancelar eventos.

4. **Formulario de evento**
   - Permitir crear y editar eventos.
   - Validar campos obligatorios, cupo, fecha y hora.
   - Mostrar mensajes claros devueltos por la API.

La interfaz debe ser responsive, reutilizar componentes y evitar duplicar la lógica de comunicación con la API.

## 5. Pruebas mínimas

### Backend

- [ ] Crear un evento válido.
- [ ] Rechazar un evento sin campos obligatorios o con cupo inválido.
- [ ] Editar un evento existente.
- [ ] Cancelar un evento y verificar que no se elimine físicamente.
- [ ] Listar eventos y aplicar cada filtro.
- [ ] Inscribir a un estudiante.
- [ ] Rechazar una inscripción duplicada.
- [ ] Rechazar una inscripción cuando no haya cupos.
- [ ] Cancelar una inscripción y liberar el cupo.
- [ ] Consultar inscritos y cupos disponibles.

### Frontend

- [ ] Verificar el flujo completo de creación de evento.
- [ ] Verificar búsqueda, filtros y detalle.
- [ ] Verificar inscripción y cancelación de inscripción.
- [ ] Verificar actualización de cupos después de cada operación.
- [ ] Verificar mensajes de error, carga y ausencia de resultados.
- [ ] Verificar la visualización en una resolución de escritorio y una móvil.

## 6. Documentación y demostración

El repositorio debe incluir:

- [ ] `README.md` con instalación, configuración, migraciones, seeders y ejecución.
- [ ] Descripción breve de la arquitectura.
- [ ] Tabla o archivo con las rutas de la API.
- [ ] Credenciales o usuarios de prueba que no contengan datos reales.
- [ ] Capturas de las vistas implementadas.
- [ ] Evidencia de las pruebas realizadas.
- [ ] Lista de funcionalidades terminadas y pendientes.

La demostración debe seguir el flujo completo descrito en la sección 1 y mostrar también un caso de error, como un cupo agotado o una inscripción duplicada.

## 7. Criterios de aceptación

El primer avance se considera listo cuando:

- El proyecto puede instalarse y ejecutarse siguiendo únicamente el README.
- Frontend, API y MySQL se comunican correctamente.
- Los cuatro requerimientos asignados tienen una implementación funcional.
- Las operaciones respetan roles, estados y cupos.
- Los filtros del catálogo funcionan de manera combinable.
- La inscripción no permite duplicados ni exceder la capacidad.
- La cancelación de un evento no borra la información histórica.
- Existen pruebas o evidencias reproducibles para los casos principales y sus errores.
- El código está integrado en una rama estable y no contiene credenciales reales.

## 8. Orden recomendado de desarrollo

1. Acordar entidades, estados, reglas y contratos de la API.
2. Configurar los proyectos y la conexión con MySQL.
3. Crear migraciones, relaciones y datos semilla.
4. Implementar y probar los endpoints del backend.
5. Implementar el catálogo y el detalle del evento.
6. Implementar creación, edición y cancelación.
7. Implementar inscripción, cancelación y consulta de inscritos.
8. Integrar todos los flujos en el frontend.
9. Ejecutar pruebas, corregir errores y revisar responsive.
10. Completar README, capturas y material de demostración.

## 9. Fuera del primer avance

No forman parte de este avance:

- Inicio de sesión con sistemas institucionales de ESPOL.
- Recuperación de contraseña o envío de correos.
- Integración con calendarios institucionales.
- Pagos.
- Códigos QR o validación de asistencia.
- Aprobación administrativa de eventos.
- Aplicación móvil nativa.
- Notificaciones push.
