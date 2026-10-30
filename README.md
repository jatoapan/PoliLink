# PoliLink

Proyecto académico de la asignatura Lenguajes de Programación 2P.

PoliLink es una plataforma web para centralizar la publicación, consulta e inscripción a eventos organizados por comunidades estudiantiles de ESPOL.

## Estado del repositorio

El backend ya dispone de autenticación local, catálogo y filtros de eventos,
gestión de comunidades, creación, edición y cancelación de eventos,
inscripciones, membresías a comunidades (solicitud, aprobación y rechazo), y
administración de categorías, modalidades y ubicaciones. El frontend está
implementado y cubierto por pruebas automatizadas en sus flujos principales:
autenticación, catálogo y detalle de eventos, creación, edición, imágenes y
cancelación de eventos por parte del organizador, onboarding de comunidades,
un directorio público de comunidades (`/comunidades`) con búsqueda y
solicitud de membresía, inscripción, cancelación y consulta de inscritos por
parte de Darwin Díaz, revisión de solicitudes de membresía por parte del
organizador de cada comunidad, y un panel de administrador (`/admin`) para
revisar solicitudes de comunidad y mantener el catálogo de categorías,
modalidades y ubicaciones. Su verificación real contra Laravel, MySQL y Vite
aún debe ejecutarse con los servicios locales activos.

## Estructura del proyecto

    polilink/
    ├── backend/                  # API y servidor Laravel con PHP
    │   ├── app/                  # Código de la aplicación
    │   ├── database/             # Migraciones, factories y seeders
    │   ├── routes/               # Rutas web y API
    │   ├── tests/                # Pruebas automatizadas
    │   └── README.md             # Instrucciones específicas del backend
    ├── frontend/                 # Interfaz React con TypeScript
    │   ├── public/               # Recursos públicos
    │   ├── src/                  # Componentes y código de la interfaz
    │   └── README.md             # Instrucciones específicas del frontend
    ├── docs/                     # Documentación técnica y bitácora
    ├── .env.example              # Ejemplo de configuración general
    └── .gitignore                # Archivos que no deben subirse

## Tecnologías

- Backend: PHP 8.3+, Laravel 13.24.0, Sanctum 4.3.3 y Composer.
- Frontend: React 19.2.8, TypeScript 6.0.2, React Router 8.3.0, Vite 8.2.0 y Node.js.
- Base de datos: MySQL 8.4.
- Control de versiones: Git y GitHub.

## Versiones principales

Las versiones declaradas en los manifiestos del proyecto son:

| Componente | Versión |
| --- | --- |
| PHP | 8.3 o superior |
| Laravel | 13.24.0 (`^13.8`) |
| Laravel Sanctum | 4.3.3 (`^4.3`) |
| PHPUnit | 12.5.33 (`^12.5.12`) |
| Node.js (Docker) | 22 |
| React | 19.2.8 |
| TypeScript | 6.0.2 |
| Vite | 8.2.0 |
| MySQL (Docker) | 8.4 |

## Inicio local recomendado

Para un entorno simple y con diagnóstico completo en VS Code, Laravel y React
se ejecutan en la máquina host. Docker Compose solo ejecuta MySQL.

### 1. Iniciar MySQL

Instalar Docker Desktop o Docker Engine con Compose y, desde la raíz del
repositorio, ejecutar:

```bash
docker compose up -d mysql
```

La base queda disponible en `127.0.0.1:3306` con base de datos `polilink`,
usuario `polilink` y contraseña `polilink`. Sus datos persisten en un volumen
de Docker.

### 2. Iniciar el backend en el host

Desde `backend/`:

```bash
composer install
cp .env.example .env
php artisan key:generate
```

En `backend/.env`, configurar:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=polilink
DB_USERNAME=polilink
DB_PASSWORD=polilink
```

Luego ejecutar:

```bash
php artisan migrate
php artisan serve
```

El backend queda disponible en `http://localhost:8000`.

### 3. Iniciar el frontend en el host

En otra terminal, desde `frontend/`:

```bash
npm install
npm run dev
```

El frontend queda disponible normalmente en `http://localhost:5173`.

## Requisitos del host

Instalar previamente:

- PHP 8.3 o superior.
- Composer.
- Node.js y npm.
- Docker Desktop o Docker Engine con Compose.

Las carpetas vendor/ y node_modules/ no se incluyen en el repositorio. Se generan localmente a partir de composer.lock y package-lock.json.

## Documentación

El índice y las rutas vigentes están en [docs/README.md](docs/README.md).

- Informe final en LaTeX: [docs/latex/main.tex](docs/latex/main.tex).
- Guía de capturas finales: [docs/latex/CAPTURAS_FINALES.md](docs/latex/CAPTURAS_FINALES.md).
- Contexto aprobado: [docs/CONTEXT/PROJECT_CONTEXT.md](docs/CONTEXT/PROJECT_CONTEXT.md).
- Contrato API: [docs/api/API.md](docs/api/API.md).
- Pruebas manuales: [docs/api/POSTMAN.md](docs/api/POSTMAN.md).

## Alcance académico

La autenticación institucional, los pagos, el correo, el calendario
institucional, los códigos QR y la validación de asistencia están fuera del
alcance de esta entrega.
