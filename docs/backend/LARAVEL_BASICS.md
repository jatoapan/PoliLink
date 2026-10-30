# Fundamentos de Laravel para PoliLink

## Propósito de esta guía

Este documento resume los conceptos de Laravel que se usarán en PoliLink y
describe el estado real del backend al momento de escribirlo. No representa
funcionalidades ya implementadas: los módulos de eventos e inscripciones aún
están pendientes.

## 1. Laravel dentro de PoliLink

Laravel es el framework PHP del backend. Recibe solicitudes HTTP, aplica las
reglas de negocio, consulta o actualiza MySQL y devuelve respuestas JSON al
frontend React.

El flujo esperado de una operación futura es:

```text
React -> ruta API -> controlador -> modelo Eloquent -> MySQL -> JSON -> React
```

Por ejemplo, al crear un evento, React enviará una solicitud a una ruta de la
API. Laravel validará los datos, verificará las reglas del organizador, creará
el registro en MySQL y devolverá el evento creado como JSON.

## 2. Estructura relevante del backend

| Ruta | Responsabilidad |
| --- | --- |
| `routes/api.php` | Define las URLs y métodos HTTP de la API. |
| `app/Http/Controllers/` | Recibe solicitudes y coordina la lógica de cada recurso. |
| `app/Http/Requests/` | Contiene validaciones reutilizables para solicitudes HTTP. |
| `app/Models/` | Contiene los modelos Eloquent asociados a las tablas. |
| `database/migrations/` | Guarda los cambios versionados de la estructura de MySQL. |
| `database/seeders/` | Crea datos de prueba reproducibles. |
| `config/` | Configuración de Laravel; por ejemplo, la conexión a la base. |
| `tests/` | Pruebas automatizadas. |
| `.env` | Configuración local y secreta; no se debe versionar. |

Laravel aplica el patrón MVC:

- **Modelo:** representa datos y relaciones.
- **Controlador:** procesa una solicitud y llama a modelos o servicios.
- **Vista:** en una aplicación Laravel tradicional puede ser Blade; en
  PoliLink la interfaz principal será React, por lo que la API devolverá JSON.

## 3. Estado actual comprobado

Actualmente `routes/api.php` solo expone el endpoint técnico:

```text
GET /api/health
```

Las migraciones base ya crean las siguientes tablas:

| Tabla | Uso |
| --- | --- |
| `migrations` | Registra qué migraciones ya se ejecutaron. |
| `users` | Usuarios base de Laravel. |
| `password_reset_tokens` | Tokens para restablecer contraseñas. |
| `sessions` | Sesiones almacenadas en la base de datos. |
| `cache` y `cache_locks` | Caché y bloqueos de caché. |
| `jobs`, `job_batches`, `failed_jobs` | Infraestructura para tareas en cola. |

Las migraciones actuales ya crean las tablas de negocio `communities`,
`community_memberships`, `events` y `registrations`. La tabla `users` usa
`is_admin`; los roles `member`, `organizer` y `tutor` viven en la relación de
membresía.

## 4. Eloquent: el ORM de Laravel

ORM significa *Object-Relational Mapper*. Eloquent permite trabajar con las
tablas de MySQL mediante objetos PHP en lugar de escribir SQL para cada
operación.

En el diseño futuro de PoliLink, la relación será:

```text
User         <-> users
Community    <-> communities
Membership   <-> community_memberships
Event        <-> events
Registration <-> registrations
```

Ejemplos de código que se usarán cuando exista el modelo `Event`:

```php
Event::where('category', 'Taller')->get();

$event->community;
$event->registrations;
```

El primer ejemplo consulta eventos por categoría. Los dos siguientes acceden a
relaciones definidas en el modelo: un evento pertenece a una comunidad y tiene
muchas inscripciones. El modelo no sustituye MySQL: Eloquent genera las
consultas y MySQL sigue almacenando los datos.

## 5. Migraciones: control de versiones de la base de datos

Una migración es un archivo PHP que describe un cambio de la estructura de la
base de datos. Se guarda en Git junto con el código, de modo que ambos
integrantes pueden recrear el mismo esquema al ejecutar las migraciones.

Cada migración tiene dos métodos:

- `up()`: aplica el cambio, por ejemplo crea una tabla o agrega una columna.
- `down()`: revierte ese cambio.

Ejemplo conceptual de una tabla futura:

```php
Schema::create('events', function (Blueprint $table) {
    $table->id();
    $table->string('title');
    $table->date('event_date');
    $table->unsignedInteger('capacity');
    $table->foreignId('community_id')->constrained();
    $table->timestamps();
});
```

Laravel registra las migraciones aplicadas en la tabla `migrations`; por eso no
repite los cambios ya ejecutados. Las migraciones actuales son:

```text
0001_01_01_000000_create_users_table.php
0001_01_01_000001_create_cache_table.php
0001_01_01_000002_create_jobs_table.php
```

Regla de equipo: no crear o alterar manualmente tablas como fuente de verdad.
Todo cambio de esquema debe llegar como una migración revisada y versionada.

## 6. MySQL local y configuración

El flujo acordado ejecuta Laravel y React en la máquina host, mientras Docker
Compose ejecuta solo MySQL. Por eso Laravel se conecta a la base publicada por
Docker usando estos valores en `backend/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=polilink
DB_USERNAME=polilink
DB_PASSWORD=polilink
```

`mysql` es el nombre de host interno entre contenedores; desde el host se debe
usar `127.0.0.1`. Las instrucciones completas de inicio están en el
`README.md` raíz y en `backend/README.md`.

Los humanos son responsables de iniciar, detener o reiniciar MySQL, Laravel y
Vite. Los agentes pueden explicar comandos y analizar los logs proporcionados,
pero no deben gestionar esos procesos.

## 7. Laravel Boost y agentes de IA

Laravel Boost es una herramienta de desarrollo opcional para agentes de IA.
Puede proporcionar un servidor MCP, guías específicas de Laravel y búsqueda de
documentación adaptada a las dependencias instaladas. También puede permitir la
inspección de rutas, esquema, logs y consultas, por lo que debe configurarse y
revisarse con cuidado.

Boost no está instalado actualmente en PoliLink. No es necesario para comenzar
los módulos base; debe evaluarse después de que existan modelos, migraciones y
controladores del dominio.

## 8. Siguiente orden de implementación

1. Agregar endpoints para descubrir comunidades y solicitar membresías.
2. Crear policies para que solo un `organizer` activo revise solicitudes y
   asigne el rol `tutor`.
3. Integrar las pantallas de membresías del frontend.
4. Agregar pruebas para estados `pending`, `active`, `rejected` y `left`.

## Referencias internas

- `backend/routes/api.php`: rutas implementadas actualmente.
- `backend/database/migrations/`: estructura base real de MySQL.
- `docs/api/API.md`: contrato planificado de la API.
- `docs/PLAN_PRIMER_AVANCE.md`: entidades, reglas y criterios de aceptación.
