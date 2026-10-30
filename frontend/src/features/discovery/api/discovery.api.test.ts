import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import { discoveryApi } from '@/features/discovery/api/discovery.api'
import { discoveryResultFixture } from '@/features/discovery/model/discovery.fixtures'
import {
  discoveryQueryLength,
  getDiscoveryQueryError,
  normalizeDiscoveryQuery,
} from '@/features/discovery/model/discovery-query'
import { ApiError } from '@/shared/errors/api-error'
import { server } from '@/test/server'

const apiUrl = 'http://localhost:8000/api'
const backendUrl = 'http://localhost:8000'

function csrfHandler() {
  return http.get(`${backendUrl}/sanctum/csrf-cookie`, () => {
    // biome-ignore lint/suspicious/noDocumentCookie: the API client reads the XSRF token from document.cookie.
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'

    return new HttpResponse(null, { status: 204 })
  })
}

describe('discovery api', () => {
  it('posts the query with the CSRF header and parses the result', async () => {
    let receivedBody: unknown
    let receivedToken: string | null = null

    server.use(
      csrfHandler(),
      http.post(`${apiUrl}/discovery/search`, async ({ request }) => {
        receivedBody = await request.json()
        receivedToken = request.headers.get('X-XSRF-TOKEN')

        return HttpResponse.json({ data: discoveryResultFixture() })
      }),
    )

    const result = await discoveryApi.search('IA presencial los viernes')

    expect(receivedBody).toEqual({
      query: 'IA presencial los viernes',
      scope: 'all',
    })
    expect(receivedToken).toBe('csrf-token')
    expect(result.mode).toBe('ai')
    expect(result.events[0]?.reasons).toContain(
      'Modalidad presencial, como pediste.',
    )
    expect(result.communities[0]?.upcoming_events_count).toBe(4)
  })

  it('sends the requested scope and parses scoped results', async () => {
    let receivedBody: unknown

    server.use(
      csrfHandler(),
      http.post(`${apiUrl}/discovery/search`, async ({ request }) => {
        receivedBody = await request.json()

        return HttpResponse.json({
          data: discoveryResultFixture({ scope: 'communities', events: [] }),
        })
      }),
    )

    const result = await discoveryApi.search('gente que programe', {
      scope: 'communities',
    })

    expect(receivedBody).toEqual({
      query: 'gente que programe',
      scope: 'communities',
    })
    expect(result.scope).toBe('communities')
    expect(result.events).toEqual([])
  })

  it('parses fallback results with their reason', async () => {
    server.use(
      csrfHandler(),
      http.post(`${apiUrl}/discovery/search`, () =>
        HttpResponse.json({
          data: discoveryResultFixture({
            mode: 'fallback',
            fallback_reason: 'timeout',
            events: [],
            communities: [],
          }),
        }),
      ),
    )

    await expect(discoveryApi.search('robótica')).resolves.toMatchObject({
      mode: 'fallback',
      fallback_reason: 'timeout',
      events: [],
    })
  })

  it('rejects responses that do not follow the contract', async () => {
    server.use(
      csrfHandler(),
      http.post(`${apiUrl}/discovery/search`, () =>
        HttpResponse.json({ data: { mode: 'magic', events: [] } }),
      ),
    )

    await expect(discoveryApi.search('robótica')).rejects.toThrow()
  })

  it('exposes validation and rate limit errors from the API', async () => {
    server.use(
      csrfHandler(),
      http.post(`${apiUrl}/discovery/search`, () =>
        HttpResponse.json(
          {
            message: 'La búsqueda debe tener al menos 3 caracteres.',
            errors: {
              query: ['La búsqueda debe tener al menos 3 caracteres.'],
            },
          },
          { status: 422 },
        ),
      ),
    )

    const validationError = await discoveryApi
      .search('ab')
      .catch((error) => error)

    expect(validationError).toBeInstanceOf(ApiError)
    expect(validationError.kind).toBe('validation')
    expect(validationError.fieldErrors.query).toEqual([
      'La búsqueda debe tener al menos 3 caracteres.',
    ])

    server.use(
      http.post(`${apiUrl}/discovery/search`, () =>
        HttpResponse.json(
          { message: 'Hiciste demasiadas búsquedas seguidas.' },
          { status: 429 },
        ),
      ),
    )

    await expect(discoveryApi.search('robótica')).rejects.toMatchObject({
      kind: 'rate_limited',
      message: 'Hiciste demasiadas búsquedas seguidas.',
    })
  })

  it('aborts the request when the signal is cancelled', async () => {
    const controller = new AbortController()

    server.use(
      csrfHandler(),
      http.post(`${apiUrl}/discovery/search`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))

        return HttpResponse.json({ data: discoveryResultFixture() })
      }),
    )

    const pending = discoveryApi.search('robótica', {
      signal: controller.signal,
    })
    controller.abort()

    await expect(pending).rejects.toBeInstanceOf(ApiError)
  })
})

describe('discovery query rules', () => {
  it('normalizes whitespace and counts code points', () => {
    expect(normalizeDiscoveryQuery('  IA   los\nviernes  ')).toBe(
      'IA los viernes',
    )
    expect(discoveryQueryLength('IA 🤖')).toBe(4)
  })

  it('mirrors the backend length rules', () => {
    expect(getDiscoveryQueryError('   ')).toBe(
      'Escribe qué te gustaría encontrar.',
    )
    expect(getDiscoveryQueryError(' ab ')).toBe(
      'La búsqueda debe tener al menos 3 caracteres.',
    )
    expect(getDiscoveryQueryError('a'.repeat(301))).toBe(
      'La búsqueda no puede superar los 300 caracteres.',
    )
    expect(getDiscoveryQueryError('abc')).toBeNull()
    expect(getDiscoveryQueryError('a'.repeat(300))).toBeNull()
  })
})
