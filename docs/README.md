# Documentación de PoliLink

Este directorio separa el contexto académico, el informe final, el
contrato de la API y las guías de implementación.

## Ubicaciones principales

| Ubicación | Contenido |
| --- | --- |
| `CONTEXT/PROJECT_CONTEXT.md` | Alcance aprobado, responsables y restricciones del proyecto. |
| `latex/` | Fuente vigente del informe final (`main.tex`) e imágenes para Overleaf. |
| `latex/CAPTURAS_FINALES.md` | Guía para obtener y verificar las dos evidencias individuales y cuatro vistas generales de la landing. |
| `api/API.md` | Endpoints disponibles y pendientes. |
| `api/SANCTUM_SESSION_AUTH.md` | Fundamentos de sesiones y CSRF con Sanctum. |
| `api/POSTMAN.md` | Guía para probar la API manualmente. |
| `api/PoliLink.postman_collection.json` | Colección importable de Postman. |
| `backend/BACKEND_DEVELOPMENT_PHASES.md` | Estado y fases de implementación Laravel. |
| `backend/FRONTEND_API_PHASES.md` | Fases de integración React con la API y su verificación. |
| `backend/DARWIN_REGISTRATIONS_HANDOFF.md` | Contrato y plan de integración de inscripciones y asistentes. |
| `backend/` | Diseño de base de datos y documentación técnica del backend. |
| `backend/COMMUNITY_MEMBERSHIP_FLOW.md` | Propuesta de descubrimiento, membresías y solicitudes de unión. |
| `UI_STANDARDS.md` | Estándares de navegación, botones, formularios, feedback y protección de cambios. |
| `PLAN_PRIMER_AVANCE.md` | Plan funcional del primer avance. |
| `BITACORA.md` | Historial de decisiones y avances. |

## Informe final en LaTeX

La única fuente vigente del informe final es `latex/main.tex`. Las imágenes se
guardan en `latex/images/` y se compila en Overleaf; no se versionan archivos
generados como PDF, AUX o LOG.

## Cómo interpretar el estado

- **Implementado en código:** existe la implementación y su contrato está
  documentado; no implica que se haya ejecutado contra servicios locales.
- **Pruebas automatizadas:** Vitest/Testing Library/MSW o PHPUnit cubren el
  comportamiento indicado en el repositorio.
- **Verificado:** el flujo fue ejecutado de extremo a extremo con navegador,
  Laravel y MySQL activos, y cuenta con evidencia reproducible.

La documentación canónica del contrato es `api/API.md`; las fases frontend y
la frontera de verificación están en `backend/FRONTEND_API_PHASES.md`; las
decisiones visuales están en `UI_STANDARDS.md`; y el historial de cambios se
registra en `BITACORA.md`.
