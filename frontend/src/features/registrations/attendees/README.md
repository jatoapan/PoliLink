# Attendee management

Organizer attendee lists and capacity views. Kept separate from the student
registration actions; every API payload is validated with Zod before use.

- `pages/EventAttendeesPage.tsx` — `/eventos/:eventId/inscritos`, linked from
  `ManagedEventCard` in `features/events/management`. Read-only: shows the
  capacity summary and the active attendees table (desktop) or stacked cards
  (mobile). Relies on the backend `403` for authorization; it never hides the
  error as an empty list.
- `components/AttendeeList.tsx` — responsive attendee table/cards.

Shared API access lives in `frontend/src/features/registrations/api` and
`frontend/src/features/registrations/hooks`.
