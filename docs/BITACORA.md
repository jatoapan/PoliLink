# Bitácora de desarrollo

## 2026-08-06 — Creación de la estructura inicial

### Objetivo

Organizar el proyecto PoliLink en una carpeta independiente y preparar los espacios de trabajo para el backend, frontend, documentación y pruebas.

### Acciones realizadas

- Se creó la carpeta raíz `polilink/`.
- Se separó el proyecto en `backend/` y `frontend/`.
- Se agregaron carpetas para componentes, páginas, servicios, tipos, rutas, migraciones y pruebas.
- Se creó un README general con el propósito y la estructura del proyecto.
- Se creó un README específico para backend y otro para frontend.
- Se agregó `.env.example` como referencia de configuración.
- Se agregó `.gitignore` para evitar versionar dependencias, credenciales y archivos generados.
- Se documentaron los endpoints iniciales de la API en `docs/api/API.md`.

### Decisiones

- Se utilizará una arquitectura cliente-servidor.
- El frontend se desarrollará con React + TypeScript.
- El backend se desarrollará con Laravel + PHP.
- La persistencia utilizará MySQL.
- La carpeta `docs/` conservará decisiones técnicas y evidencia del desarrollo.

### Estado

La estructura está preparada, pero los frameworks y dependencias todavía no han sido instalados. La siguiente actividad es inicializar las aplicaciones de Laravel y React dentro de sus respectivas carpetas.

## 2026-08-06 — Inicialización de Laravel y React

### Objetivo

Convertir la estructura inicial en dos aplicaciones ejecutables y comprobar que el backend y el frontend compilan correctamente.

### Acciones realizadas

- Se inicializó Laravel 13.24.0 en `backend/` con Composer.
- Se instalaron las dependencias PHP y se generó la configuración local de Laravel.
- Se inicializó React + TypeScript + Vite 8.2.1 en `frontend/`.
- Se instalaron las dependencias JavaScript con npm.
- Se agregó `GET /api/health` para comprobar que la API responde.
- Se registró `routes/api.php` en la configuración de Laravel.
- Se reemplazó la pantalla de ejemplo de Vite por una pantalla inicial de PoliLink.
- Se actualizaron los README de backend y frontend con sus comandos y estructura.
- Se ajustó `.env.example` del backend para usar MySQL, la base `polilink` y configuración regional en español.

### Verificaciones

- `php artisan about`: correcto.
- `npm run build`: correcto.
- Dependencias npm auditadas: sin vulnerabilidades reportadas.

### Estado

Backend y frontend inicializados y compilables. El siguiente trabajo es definir las migraciones y modelos de usuarios, comunidades, eventos e inscripciones.

## Plantilla para próximas entradas

### AAAA-MM-DD — Título del trabajo

#### Objetivo

Descripción breve de lo que se pretende realizar.

#### Acciones realizadas

- Archivo o componente creado.
- Funcionalidad implementada.
- Prueba ejecutada.

#### Decisiones o problemas

Registrar decisiones relevantes, errores encontrados y su solución.

#### Estado

Indicar si quedó terminado, pendiente o bloqueado.

## 2026-08-06 — Modelo de datos y datos semilla

### Acciones realizadas

- Se agregó el rol del usuario en la tabla users.
- Se crearon las tablas communities, events y registrations.
- Se definieron claves foráneas, índices y restricción contra inscripciones duplicadas.
- Se crearon los modelos Eloquent Community, Event y Registration.
- Se agregaron relaciones entre usuarios, comunidades, eventos e inscripciones.
- Se implementó el cálculo de cupos disponibles en el modelo Event.
- Se actualizó DatabaseSeeder con usuarios, comunidad, evento e inscripción de prueba.
- Se agregó una prueba de relaciones y cálculo de cupos.

### Verificaciones

- php artisan migrate:fresh --seed: correcto.
- php artisan test: 4 pruebas exitosas y 5 aserciones.
- El seeder crea una base local reproducible para el desarrollo.

### Estado

La persistencia inicial está lista. El siguiente trabajo es implementar los endpoints de consulta, creación, edición, cancelación e inscripción.

## 2026-08-06 — API REST inicial

### Acciones realizadas

- Se implementó EventController para listar, filtrar, consultar, crear, editar y cancelar eventos.
- Se implementó RegistrationController para inscribir, cancelar inscripciones y consultar inscritos.
- Se agregaron las rutas REST de eventos e inscripciones.
- Se agregaron validaciones de roles, estados, cupos y datos obligatorios.
- Se agregaron comprobaciones de propiedad para que un organizador solo gestione sus eventos.
- Se documentó el uso temporal de organizer_id y student_id mientras no exista autenticación.
- Se agregaron pruebas de catálogo, filtros, creación, cancelación, inscripción y consulta de inscritos.
- Se corrigió una comparación estricta de IDs detectada por las pruebas con SQLite.

### Verificaciones

- php artisan route:list --path=api: 9 rutas disponibles.
- php artisan test: 8 pruebas exitosas y 23 aserciones.

### Estado

La API REST inicial está funcional y probada. El siguiente trabajo es conectar el frontend con estos endpoints.

## 2026-08-06 — Reversión de módulos asignados

### Motivo

Los módulos de eventos e inscripciones serán implementados directamente por Darwin y Gabriel. Se retiró su implementación del molde principal para evitar interferir con su trabajo.

### Acciones realizadas

- Se eliminaron los controladores de eventos e inscripciones.
- Se eliminaron las rutas REST de eventos e inscripciones.
- Se eliminaron los modelos y migraciones de comunidades, eventos e inscripciones.
- Se retiraron las relaciones específicas del modelo User.
- Se retiró el campo role de la migración base de usuarios.
- Se dejó el seeder con un único usuario genérico.
- Se eliminaron las pruebas específicas de eventos, relaciones e inscripciones.
- Se conservó el endpoint GET /api/health y su prueba.
- Se actualizó la documentación para marcar la API como propuesta pendiente.

### Estado

El proyecto contiene únicamente la infraestructura base sobre la cual Darwin y Gabriel pueden implementar sus respectivos módulos.

## 2026-08-08 — Preparación para GitHub

### Acciones realizadas

- Se revisó el contenido del repositorio remoto y se confirmó que solo tenía un README inicial.
- Se actualizó el README principal con la estructura del monorepo, requisitos e instrucciones de ejecución.
- Se agregó una copia del plan del primer avance dentro de docs/ para evitar enlaces fuera del repositorio.
- Se identificaron como excluibles las dependencias instaladas, archivos .env, base SQLite local, compilación, cachés y logs.
- Se conservaron composer.lock y package-lock.json para que cada integrante pueda reinstalar las mismas dependencias.

### Estado

El molde está listo para inicializarse como repositorio Git y subirse al remoto, después de verificar que no queden archivos generados ni credenciales.

### Verificación adicional

- Se añadió la prueba automatizada `tests/Feature/HealthTest.php` para `GET /api/health`.
- La ruta API aparece en el listado de rutas y las pruebas del backend pasan correctamente.
- Se corrigió un error de namespace detectado durante la primera comprobación de rutas.

## 2026-08-16 — Gestión de imágenes y cancelación en el organizador

### Objetivo

Completar la integración frontend de las acciones que faltaban en la gestión de
eventos: edición de portada y cancelación con estados seguros.

### Acciones realizadas

- Se añadió un editor de imagen dentro de `/eventos/:eventId/editar` para
  reemplazar o eliminar la portada sin reenviar el formulario del evento.
- Se reutilizó el uploader compartido para preview local, imagen actual,
  fallback, validación JPG/PNG/WebP de hasta 5 MB y estados de carga.
- Se conectaron las mutaciones de subida y eliminación con la actualización de
  las cachés de detalle, catálogo e historial del organizador.
- Se completó la cobertura de cancelación: confirmación, `PATCH` sin cuerpo,
  bloqueo de doble envío y errores `403`, `409`, `422` y de red.
- Se actualizaron la guía de fases, los estándares UI y el README del frontend.

### Verificaciones

- `npm run test:run`: 29 archivos y 127 pruebas exitosas.
- `npm run typecheck`: correcto.
- Biome sobre los archivos de esta fase: correcto; permanecen advertencias
  preexistentes de `document.cookie` en pruebas existentes.
- La verificación navegador → Laravel → MySQL queda pendiente de ejecutar con
  los servicios locales activos.

### Estado

Las Fases 3.6 y 3.7 están implementadas y cubiertas automáticamente. La
verificación real y la evidencia final del organizador quedan como requisito
antes de cerrar toda la integración y comenzar las inscripciones de Darwin.

## 2026-08-16 — Cierre documental de la integración del organizador

### Objetivo

Dejar alineados los documentos Markdown con el estado actual del código y
separar claramente implementación, pruebas automatizadas y verificación real.

### Acciones realizadas

- Se actualizó el índice documental y el README raíz con el estado de las
  fases del organizador y la responsabilidad pendiente de Darwin.
- Se corrigió `docs/backend/FRONTEND_API_PHASES.md` para marcar la integración
  de comunidades y eventos como implementada en código, manteniendo pendiente
  únicamente la ejecución navegador → Laravel → MySQL.
- Se añadió un checklist reproducible para validar creación, edición, portada,
  cancelación, permisos, conflictos y errores de red.
- Se documentó en Postman el reemplazo y la eliminación de imágenes de eventos.
- Se sincronizó la guía del módulo frontend con las mutaciones de imagen y
  cancelación disponibles.
- Se aclaró en el plan académico que sus casillas históricas no sustituyen el
  estado técnico vigente.

### Estado

La documentación del alcance implementado está disponible en archivos Markdown.
La verificación real no se marca como completada porque requiere que una
persona inicie los servicios locales y registre evidencia del recorrido.
