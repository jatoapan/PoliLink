# Student registrations

Student event registration, cancellation, reactivation, and "my
registrations" flows. Preserve the backend rule that cancellation releases
the event capacity.

- `components/EventRegistrationAction.tsx` — register/cancel action rendered
  inside `EventDetailPage`. Derives whether the current user is registered
  from `GET /me/registrations` and keeps the latest mutation outcome as the
  immediate source of truth until the query refetches.
- `components/RegistrationCard.tsx` and `CancelRegistrationDialog.tsx` — used
  by `pages/MyRegistrationsPage.tsx` (`/mis-inscripciones`).
- `pages/MyRegistrationsPage.tsx` — paginated list of the session user's
  active registrations, with a confirmation dialog to cancel.

Shared API access lives in `frontend/src/features/registrations/api` and
`frontend/src/features/registrations/hooks`.
