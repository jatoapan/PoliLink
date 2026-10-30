# Frontend de PoliLink

Interfaz web de PoliLink, desarrollada con React 19.2.8, TypeScript 6.0.2 y
Vite 8.2.

## Versiones principales

| Herramienta | Versión |
| --- | --- |
| Node.js (Docker) | 22 |
| React | 19.2.8 |
| React Router | 8.3.0 |
| TypeScript | 6.0.2 |
| Vite | 8.2.0 |
| TanStack Query | 5.101.4 |
| Vitest | 4.1.10 |

## Comandos

Desde esta carpeta:

```bash
npm install
npm run dev
```

Comandos de calidad y producción:

```bash
npm run format
npm run lint
npm run typecheck
npm run test:run
npm run build
```

`npm run check` combina Biome y TypeScript. El frontend usa Biome para
formateo/linting y Vitest, Testing Library y MSW para pruebas. No se debe
incluir `any`, tipos débiles (`{}`, `object`, `Function`) ni aserciones no nulas.

## Estructura relevante

```text
frontend/
├── public/                  # Recursos públicos
├── src/app/                 # Router, providers, layout y páginas de aplicación
├── src/features/            # Módulos por dominio y sus contratos API
│   ├── auth/
│   ├── communities/
│   └── events/
├── src/shared/              # Cliente HTTP, configuración y errores compartidos
├── src/test/                # Setup de Vitest y servidor MSW
├── src/App.tsx              # Composición de providers y router
└── src/main.tsx             # Punto de entrada
```

Cada feature debe mantener juntas sus páginas, componentes, hooks, esquemas
Zod y módulos de API. `src/shared/` solo contiene piezas reutilizadas por más
de un dominio. Las llamadas protegidas conservan las cookies de Sanctum y el
flujo CSRF del backend.

## Estado

La base de la aplicación está configurada con React Router, React Query,
validación Zod, formularios React Hook Form y una política TypeScript estricta.
La fase de autenticación tiene integración de sesión con Laravel Sanctum y una
primera interfaz funcional: `/iniciar-sesion`, `/registrarse`, redirecciones internas
seguras, validación de correos `@espol.edu.ec`, confirmación de contraseña,
errores de validación, logout y menú de usuario en el encabezado.

Los errores de API se clasifican y traducen en `src/shared/errors/`. Para
estados de consulta usa `ApiErrorFeedback`, que incluye el mensaje genérico y
la acción de reintento. Las features solo deben definir overrides cuando el
contexto necesite una explicación distinta, como un evento inexistente o un
conflicto específico. Los mensajes crudos del backend no deben mostrarse
directamente.

La verificación navegador → Laravel todavía debe ejecutarse con los servicios
locales. La integración actual incluye el catálogo público,
los filtros, la paginación y el detalle de eventos en `/eventos` y
`/eventos/:eventId`. La experiencia de comunidades incluye el onboarding en
`/organizar`, la creación en `/crear-comunidad`, el seguimiento en
`/mis-solicitudes` y el panel en `/mis-comunidades`. El panel de eventos está
disponible en `/mis-eventos` para consultar el historial paginado del
organizador. La publicación, edición, gestión inmediata de imágenes y
cancelación de eventos activos están implementadas en código y cubiertas por
pruebas automatizadas; aún falta comprobar el recorrido completo contra
Laravel y MySQL locales. También están integradas las inscripciones, la vista
de asistentes, el directorio de comunidades, las membresías y el panel
administrativo en `/admin`.

Las rutas visibles del navegador usan español; los nombres de componentes,
variables, hooks y servicios permanecen en inglés. Los endpoints `/api/...`
conservan los nombres definidos por el contrato backend.

### Rutas de comunidades

- `/organizar`: explica cómo participar y descubrir la experiencia de
  organización.
- `/crear-comunidad`: onboarding guiado de dos pasos para registrar una
  comunidad nueva.
- `/mis-solicitudes`: historial y estado de las solicitudes de creación.
- `/mis-comunidades`: panel de comunidades administradas y acceso a las
  siguientes herramientas de organización.
- `/organizador`: redirección heredada hacia `/organizar`.
