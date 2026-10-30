import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'

import { request } from '@/shared/api/client'
import { server } from '@/test/server'

const backendUrl = 'http://localhost:8000'

afterEach(() => {
  document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/'
})

describe('API client', () => {
  it('returns an unknown payload for a successful JSON response', async () => {
    server.use(
      http.get('http://localhost:8000/api/test', () =>
        HttpResponse.json({ status: 'ok' }),
      ),
    )

    await expect(request('/test')).resolves.toEqual({ status: 'ok' })
  })

  it('exposes status and payload for API errors', async () => {
    server.use(
      http.get('http://localhost:8000/api/missing', () =>
        HttpResponse.json(
          {
            errors: { email: ['The email field is invalid.'] },
            message: 'Not found',
          },
          { status: 404 },
        ),
      ),
    )

    await expect(request('/missing')).rejects.toMatchObject({
      status: 404,
      payload: {
        errors: { email: ['The email field is invalid.'] },
        message: 'Not found',
      },
      message: 'Not found',
      fieldErrors: { email: ['The email field is invalid.'] },
    })
  })

  it('gets a CSRF cookie before a state-changing request', async () => {
    let csrfRequests = 0

    server.use(
      http.get(`${backendUrl}/sanctum/csrf-cookie`, () => {
        csrfRequests += 1
        document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
        return new HttpResponse(null, { status: 204 })
      }),
      http.post(`${backendUrl}/api/protected`, ({ request: receivedRequest }) => {
        expect(receivedRequest.credentials).toBe('include')
        expect(receivedRequest.headers.get('X-XSRF-TOKEN')).toBe('csrf-token')
        expect(receivedRequest.headers.get('Content-Type')).toContain(
          'application/json',
        )

        return HttpResponse.json({ status: 'ok' })
      }),
    )

    await expect(
      request('/protected', { method: 'POST', body: { enabled: true } }),
    ).resolves.toEqual({ status: 'ok' })

    expect(csrfRequests).toBe(1)
  })

  it('sends FormData without forcing JSON content type', async () => {
    let csrfRequests = 0

    server.use(
      http.get(`${backendUrl}/sanctum/csrf-cookie`, () => {
        csrfRequests += 1
        document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
        return new HttpResponse(null, { status: 204 })
      }),
      http.post(`${backendUrl}/api/upload`, async ({ request: receivedRequest }) => {
        expect(receivedRequest.headers.get('Content-Type')).toMatch(
          /^multipart\/form-data; boundary=/,
        )
        expect(receivedRequest.headers.get('X-XSRF-TOKEN')).toBe('csrf-token')
        expect((await receivedRequest.formData()).get('name')).toBe('cover')

        return HttpResponse.json({ status: 'uploaded' })
      }),
    )

    const formData = new FormData()
    formData.append('name', 'cover')

    await expect(
      request('/upload', { method: 'POST', body: formData }),
    ).resolves.toEqual({ status: 'uploaded' })
    expect(csrfRequests).toBe(1)
  })

  it('refreshes CSRF and retries once after a 419 response', async () => {
    let csrfRequests = 0
    let mutationRequests = 0
    document.cookie = 'XSRF-TOKEN=stale-token; path=/'

    server.use(
      http.get(`${backendUrl}/sanctum/csrf-cookie`, () => {
        csrfRequests += 1
        document.cookie = 'XSRF-TOKEN=fresh-token; path=/'
        return new HttpResponse(null, { status: 204 })
      }),
      http.patch(`${backendUrl}/api/protected`, ({ request: receivedRequest }) => {
        mutationRequests += 1

        if (mutationRequests === 1) {
          return new HttpResponse(null, { status: 419 })
        }

        expect(receivedRequest.headers.get('X-XSRF-TOKEN')).toBe('fresh-token')
        return HttpResponse.json({ status: 'updated' })
      }),
    )

    await expect(
      request('/protected', { method: 'PATCH', body: { enabled: true } }),
    ).resolves.toEqual({ status: 'updated' })

    expect(csrfRequests).toBe(1)
    expect(mutationRequests).toBe(2)
  })

  it('refreshes CSRF and retries a FormData request after a 419 response', async () => {
    let csrfRequests = 0
    let mutationRequests = 0

    server.use(
      http.get(`${backendUrl}/sanctum/csrf-cookie`, () => {
        csrfRequests += 1
        document.cookie = 'XSRF-TOKEN=fresh-token; path=/'
        return new HttpResponse(null, { status: 204 })
      }),
      http.post(`${backendUrl}/api/upload`, async ({ request: receivedRequest }) => {
        mutationRequests += 1

        if (mutationRequests === 1) {
          return new HttpResponse(null, { status: 419 })
        }

        expect(receivedRequest.headers.get('X-XSRF-TOKEN')).toBe('fresh-token')
        expect(receivedRequest.headers.get('Content-Type')).toMatch(
          /^multipart\/form-data; boundary=/,
        )
        expect((await receivedRequest.formData()).get('name')).toBe('cover')

        return HttpResponse.json({ status: 'retried' })
      }),
    )

    const formData = new FormData()
    formData.append('name', 'cover')

    await expect(
      request('/upload', { method: 'POST', body: formData }),
    ).resolves.toEqual({ status: 'retried' })
    expect(csrfRequests).toBe(2)
    expect(mutationRequests).toBe(2)
  })
})
