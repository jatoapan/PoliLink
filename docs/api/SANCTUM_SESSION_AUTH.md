# Autenticación con Laravel Sanctum basada en cookies

## Idea central

PoliLink usa Laravel Sanctum en modo SPA. No utiliza JWT ni tokens `Bearer`.
La identidad del usuario se mantiene en una sesión del backend y el navegador
envía la cookie de sesión automáticamente en cada solicitud autorizada.

La sesión y el token CSRF cumplen funciones distintas:

| Valor | Función |
| --- | --- |
| Cookie de sesión (`SESSION_COOKIE`) | Identifica al usuario autenticado. Normalmente es `HttpOnly`. |
| `XSRF-TOKEN` | Permite comprobar que la solicitud proviene de la aplicación confiable. Es legible por el frontend. |
| `X-XSRF-TOKEN` | Encabezado que el frontend copia desde `XSRF-TOKEN` para solicitudes mutables. |

El token CSRF no reemplaza la sesión ni concede permisos. Un atacante podría
intentar enviar la cookie de sesión del navegador, pero no puede leer el
`XSRF-TOKEN` de PoliLink desde otro origen. Un token obtenido en su propia
sesión tampoco sirve con la sesión de otra persona.

## Flujo normal

1. El frontend solicita `GET /sanctum/csrf-cookie` con
   `credentials: include`.
2. Laravel establece la cookie `XSRF-TOKEN` y la cookie de sesión.
3. Para `POST`, `PATCH` o `DELETE`, el frontend lee `XSRF-TOKEN` y lo envía
   como `X-XSRF-TOKEN`. También conserva `credentials: include`.
4. Laravel valida el CSRF, obtiene al usuario desde la sesión y aplica sus
   políticas de autorización.

El login sigue esta secuencia:

```text
GET  /sanctum/csrf-cookie
POST /api/auth/login       { email, password }
GET  /api/auth/me
```

El registro usa el mismo proceso con `POST /api/auth/register`. Solo se
aceptan correos que terminen exactamente en `@espol.edu.ec`, tanto al registrar
como al iniciar sesión. `password_confirmation` debe coincidir con `password`.
Después del login o registro, `GET /api/auth/me` confirma la sesión y devuelve
la cuenta, `is_admin` y sus membresías comunitarias. El registro no asigna un
rol global; los permisos de eventos se resuelven mediante una membresía activa
con rol `organizer` en la comunidad correspondiente.

## Solicitud protegida de ejemplo

```http
POST /api/events
Cookie: <cookie de sesión>; XSRF-TOKEN=<token>
X-XSRF-TOKEN: <token>
Content-Type: application/json
```

La cookie identifica al usuario. El token CSRF protege la solicitud contra
peticiones falsificadas. Después, el backend verifica que el usuario tenga una
membresía activa con rol `organizer` en la comunidad del evento.

## Logout y respuestas comunes

`DELETE /api/auth/logout` requiere sesión y CSRF. Laravel invalida la sesión y
regenera el token. El frontend debe limpiar su estado local después.

| Código | Significado |
| --- | --- |
| `401` | No hay sesión válida o las credenciales son incorrectas. |
| `403` | Hay sesión, pero el usuario no tiene permiso. |
| `419` | CSRF ausente o vencido; el cliente debe obtenerlo nuevamente. |
| `422` | Datos enviados inválidos. |
| `429` | Demasiados intentos de login. |

En desarrollo, Laravel debe conservar `FRONTEND_URL=http://localhost:5173` y
`SANCTUM_STATEFUL_DOMAINS=localhost:5173`. CORS debe permitir ese origen y
credenciales. El cliente compartido implementa este flujo en
`frontend/src/shared/api/client.ts`.
