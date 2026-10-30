# Organizer management

The backend contract for the organizer experience is documented canonically in
`docs/api/API.md`. The frontend must use the authenticated user session and
must not send user, role, or ownership identifiers.

## Communities and dashboard

The organizer dashboard now consumes:

- `POST /community-creation-requests` to propose a community. It accepts
  `name`, an optional `description`, and an optional `image`; it returns `201`
  with a `pending` request. The backend generates `slug`, so the frontend must
  not send it. The authenticated user becomes `organizer` only after an admin
  approves the proposal.
- `GET /me/communities` to load managed communities. It returns `{ data: [] }`
  when the user has none.
- `GET /me/events?page=1&per_page=12` to load the organizer’s events. It is
  paginated, includes cancelled events, and returns the shared event resource.
  `per_page` accepts `1` through `50`.

These endpoints are protected by Sanctum. A `401` means the session is absent;
`403` means the user lacks the required role or ownership; validation errors
are `422` with Laravel’s field-level `errors` object.

Authenticated students discover the organization experience from
`/organizar`, then use the two-step onboarding at `/crear-comunidad` to
submit a pending community proposal. The global `Volver a organizar` action
returns to the organizer entry point and confirms before discarding entered
data; in the second step, `Editar información` returns to the first step.
After submission, the frontend redirects to `/mis-solicitudes`, where users
can review pending, approved, and rejected proposals. Existing organizers use
`/mis-comunidades` to see their managed communities and start the next
management flows. Public community links must use `slug`, while membership,
image, event filters, and `community_id` operations continue to use numeric
`id`. The legacy `/organizador` route redirects to `/organizar`.

The option to connect an existing community is shown as a future capability;
the current frontend does not simulate a membership or representation request.
Community editing and deletion are not available in the backend contract.

## Events

The typed `organizerEventsApi` surface in
`src/features/events/api/events.api.ts` supports:

- `list()` through `GET /me/events`.
- `create()` through multipart `POST /events`, with an optional `image` file.
- `update()` through JSON `PATCH /events/{event}`.
- `uploadImage()` through multipart `POST /events/{event}/image`.
- `removeImage()` through `DELETE /events/{event}/image`.
- `cancel()` through empty-body `PATCH /events/{event}/cancel`.

The shared HTTP client preserves Sanctum cookies and CSRF handling for both JSON
and `FormData` requests. It must not set `Content-Type` manually for
`FormData`, so the browser can provide the multipart boundary.

Event responses expose `image_url`, which is nullable for existing events
without a cover image. The dashboard is available at `/mis-eventos`; it
renders published and cancelled events with pagination, status, community,
capacity, and image information. Published events expose an `Editar evento`
action that opens the shared two-step form at
`/eventos/{event}/editar`. The form preloads the event, converts its UTC
timestamp to the ESPOL timezone, sends editable fields as JSON through
`PATCH /events/{event}`, and returns to `/mis-eventos` with an update
confirmation. The edit form keeps event fields as JSON and manages the image
independently: it shows the current cover or a Lucide fallback, validates JPG,
PNG, and WebP files up to 5 MB, uploads replacements immediately, and asks for
confirmation before removing a cover. Successful image mutations refresh the
event detail, public catalog, and organizer history queries.

The dashboard exposes `Cancelar evento` only for published events. The action
requires confirmation, sends an empty-body `PATCH`, disables duplicate
submissions, preserves the cancelled event in history, and removes its public,
edit, and repeated-cancellation actions. API failures (`401`, `403`, `409`,
`422`, and network errors) use the shared Spanish feedback and retry behavior.

Automated coverage lives in the event API, organizer dashboard, and edit-page
tests. The current frontend suite passes 127 tests and TypeScript typecheck;
browser-to-Laravel-to-MySQL verification remains pending until humans start
the local services and execute the acceptance checklist in
`docs/backend/FRONTEND_API_PHASES.md`.
