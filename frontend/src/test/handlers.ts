import { http, HttpResponse, type RequestHandler } from 'msw'

export const handlers: Array<RequestHandler> = [
  http.get('http://localhost:8000/api/auth/me', () =>
    HttpResponse.json(
      { message: 'Unauthenticated.' },
      { status: 401 },
    ),
  ),
  http.get('http://localhost:8000/api/events', () =>
    HttpResponse.json({
      data: [],
      meta: { current_page: 1, last_page: 1, per_page: 3, total: 0 },
    }),
  ),
  http.get('http://localhost:8000/api/communities/discover', () =>
    HttpResponse.json({
      data: [],
      links: { first: null, last: null, prev: null, next: null },
      meta: { current_page: 1, last_page: 1, per_page: 3, total: 0 },
    }),
  ),
]
