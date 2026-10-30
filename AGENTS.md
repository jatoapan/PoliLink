# Repository Guidelines

## Project Structure

PoliLink is a Laravel API and React SPA for publishing and discovering ESPOL
community events. Backend source is in `backend/app/`, routes in
`backend/routes/`, database migrations and seeders in `backend/database/`, and
PHPUnit feature tests in `backend/tests/`. Frontend source is in
`frontend/src/`; static assets are in `frontend/public/`. Technical docs and
the proposal are under `docs/`, especially `docs/CONTEXT/`, `docs/api/`, and
`docs/latex/`.

The backend currently implements local Sanctum authentication, communities,
event catalog/filtering, event management, and registrations. The React UI is
still a starter screen with partial API helpers, so do not describe frontend
flows as complete unless they are actually wired and checked.

## Development Commands

Humans manage Docker, MySQL, Laravel, and Vite processes. From the repository
root, start only MySQL with `docker compose up -d mysql`. In `backend/`, use
`composer install`, `php artisan migrate`, and `php artisan serve`. In
`frontend/`, use `npm install` and `npm run dev`. Available checks are
`php artisan test`, `vendor/bin/pint --test`, `npm run lint`, and
`npm run build`. Agents must run tests, builds, or validation only when the
task explicitly requests them.

## Code Style and Testing

Use four-space indentation in PHP and two spaces in TypeScript. Follow Laravel
conventions: PascalCase classes, camelCase methods, Form Requests for input
validation, Policies for authorization, and timestamped migration names.
React components use PascalCase; helpers and variables use camelCase.
Name PHPUnit methods `test_<behavior>`. Add feature coverage for changed API
rules and authorization paths; no formal frontend coverage threshold is set.

## Language and URL Conventions

Keep source-code identifiers, filenames, comments, and API client methods in
English. Write user-facing labels, messages, documentation examples shown to
users, and browser routes in Spanish. For example, use `/eventos` and
`/iniciar-sesion` for frontend navigation while keeping names such as
`EventCatalogPage`, `useAuth`, and `eventDetail` in English. Backend API paths
such as `/api/auth/login` and `/api/events` remain unchanged because they are
part of the existing contract.

## Scope, Security, and Documentation

Organizers publish, edit, and cancel events directly; students register and
cancel registrations. Do not add approval workflows, institutional
integrations, payments, email/calendar integration, QR codes, or attendance
validation without approval. Keep credentials in `.env`, never commit them,
and use `backend/.env.example` as the template. Use `127.0.0.1` for host
Laravel-to-MySQL connections; `mysql` is only a container hostname.

Keep `docs/api/API.md`, the approved context, README files, and the LaTeX
proposal consistent. Mark planned behavior as planned.

## Commits and Pull Requests

Use concise conventional-style messages such as `feat: add event filters` or
`docs: update API guide`. PRs should explain the scope, list checks actually
run, identify known limitations, and include UI or proposal screenshots when
relevant. Preserve unrelated working-tree changes.

After completing an approved implementation plan, run the relevant checks,
review the final status and diff, and create a conventional commit
automatically. Stage only files belonging to that implementation, do not
include unrelated changes or secrets, and do not push unless explicitly asked.
If the worktree has no changes, do not create an empty commit.
