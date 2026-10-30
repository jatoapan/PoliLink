import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import {
  organizerEventsApi,
  publicEventsApi,
} from '@/features/events/api/events.api'
import { server } from '@/test/server'

const apiUrl = 'http://localhost:8000/api'
const backendUrl = 'http://localhost:8000'

const event = {
  id: 7,
  title: 'Taller Laravel',
  description: 'Introducción a Laravel.',
  image_url: null,
  starts_at: '2026-08-20T15:00:00.000000Z',
  capacity: 30,
  available_capacity: 29,
  category: { id: 3, code: 'hackathon', name: 'Hackathon' },
  modality: { id: 1, code: 'in_person', name: 'Presencial' },
  location: { id: 1, name: 'Campus', description: null },
  community: {
    id: 4,
    name: 'TAWS',
    slug: 'taws',
    description: null,
  },
  status: { code: 'published', name: 'Publicado' },
  created_at: '2026-08-01T15:00:00.000000Z',
  updated_at: '2026-08-01T15:00:00.000000Z',
}

describe('public events API', () => {
  it('maps catalog filters to the Laravel query contract', async () => {
    server.use(
      http.get(`${apiUrl}/events`, ({ request }) => {
        const query = new URL(request.url).searchParams

        expect(query.get('search')).toBe('laravel')
        expect(query.get('date')).toBe('2026-08-20')
        expect(query.get('category')).toBe('hackathon')
        expect(query.get('modality')).toBe('in_person')
        expect(query.get('community_id')).toBe('4')
        expect(query.get('page')).toBe('2')
        expect(query.get('per_page')).toBe('12')

        return HttpResponse.json({
          data: [event],
          meta: {
            current_page: 2,
            last_page: 3,
            per_page: 12,
            total: 25,
          },
        })
      }),
    )

    await expect(
      publicEventsApi.list({
        search: 'laravel',
        date: '2026-08-20',
        category: 'hackathon',
        modality: 'in_person',
        communityId: 4,
        page: 2,
        perPage: 12,
      }),
    ).resolves.toMatchObject({
      data: [event],
      meta: { current_page: 2, last_page: 3 },
    })
  })

  it('parses event details and public reference data', async () => {
    server.use(
      http.get(`${apiUrl}/events/7`, () => HttpResponse.json({ data: event })),
      http.get(`${apiUrl}/event-categories`, () =>
        HttpResponse.json({ data: [event.category] }),
      ),
      http.get(`${apiUrl}/event-modalities`, () =>
        HttpResponse.json({ data: [event.modality] }),
      ),
      http.get(`${apiUrl}/communities`, () =>
        HttpResponse.json({ data: [event.community] }),
      ),
    )

    await expect(publicEventsApi.detail(7)).resolves.toEqual(event)
    await expect(publicEventsApi.categories()).resolves.toEqual([
      event.category,
    ])
    await expect(publicEventsApi.modalities()).resolves.toEqual([
      event.modality,
    ])
    await expect(publicEventsApi.communities()).resolves.toEqual([
      event.community,
    ])
  })
})

describe('organizer events API', () => {
  it('maps organizer event pagination to the Laravel query contract', async () => {
    server.use(
      http.get(`${apiUrl}/me/events`, ({ request }) => {
        const query = new URL(request.url).searchParams

        expect(query.get('page')).toBe('2')
        expect(query.get('per_page')).toBe('12')

        return HttpResponse.json({
          data: [event],
          meta: {
            current_page: 2,
            last_page: 3,
            per_page: 12,
            total: 25,
          },
        })
      }),
    )

    await expect(
      organizerEventsApi.list({ page: 2, perPage: 12 }),
    ).resolves.toMatchObject({
      data: [event],
      meta: { current_page: 2, last_page: 3 },
    })
  })

  it('cancels an event with an empty PATCH request', async () => {
    // biome-ignore lint/suspicious/noDocumentCookie: The request client reads this cookie during the integration test.
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'

    server.use(
      http.patch(`${apiUrl}/events/7/cancel`, async ({ request }) => {
        expect(await request.text()).toBe('')

        return HttpResponse.json({
          data: {
            ...event,
            status: { code: 'cancelled', name: 'Cancelado' },
          },
        })
      }),
    )

    await expect(organizerEventsApi.cancel(event.id)).resolves.toMatchObject({
      status: { code: 'cancelled', name: 'Cancelado' },
    })
  })

  it('serializes event creation as multipart with an optional image', async () => {
    server.use(
      http.get(`${backendUrl}/sanctum/csrf-cookie`, () => {
        document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
        return new HttpResponse(null, { status: 204 })
      }),
      http.post(`${apiUrl}/events`, async ({ request }) => {
        expect(request.headers.get('Content-Type')).toMatch(
          /^multipart\/form-data; boundary=/,
        )

        const formData = await request.formData()

        expect(formData.get('community_id')).toBe('4')
        expect(formData.get('event_category_id')).toBe('3')
        expect(formData.get('event_modality_id')).toBe('1')
        expect(formData.get('location_id')).toBe('1')
        expect(formData.get('capacity')).toBe('25')
        expect(formData.get('image')).toMatchObject({ type: 'image/webp' })

        return HttpResponse.json(
          {
            data: {
              ...event,
              image_url: 'http://localhost:8000/storage/events/cover.webp',
            },
          },
          { status: 201 },
        )
      }),
    )

    await expect(
      organizerEventsApi.create({
        community_id: 4,
        event_category_id: 3,
        event_modality_id: 1,
        location_id: 1,
        title: 'Taller Laravel',
        description: 'Introducción a Laravel.',
        starts_at: '2026-08-20T10:00:00-05:00',
        capacity: 25,
        image: new File(['cover'], 'cover.webp', { type: 'image/webp' }),
      }),
    ).resolves.toMatchObject({
      image_url: 'http://localhost:8000/storage/events/cover.webp',
    })
  })

  it('serializes JSON when creating an event without an image', async () => {
    server.use(
      http.get(`${backendUrl}/sanctum/csrf-cookie`, () => {
        document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
        return new HttpResponse(null, { status: 204 })
      }),
      http.post(`${apiUrl}/events`, async ({ request }) => {
        expect(request.headers.get('Content-Type')).toContain(
          'application/json',
        )
        expect(await request.json()).toEqual({
          community_id: 4,
          event_category_id: 3,
          event_modality_id: 1,
          location_id: 1,
          title: 'Taller Laravel',
          description: 'Introducción a Laravel.',
          starts_at: '2026-08-20T10:00:00-05:00',
          capacity: 25,
        })
        return HttpResponse.json({ data: event }, { status: 201 })
      }),
    )

    await expect(
      organizerEventsApi.create({
        community_id: 4,
        event_category_id: 3,
        event_modality_id: 1,
        location_id: 1,
        title: 'Taller Laravel',
        description: 'Introducción a Laravel.',
        starts_at: '2026-08-20T10:00:00-05:00',
        capacity: 25,
      }),
    ).resolves.toMatchObject({ image_url: null })
  })

  it('keeps JSON updates and supports image replacement and removal', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'

    server.use(
      http.patch(`${apiUrl}/events/7`, async ({ request }) => {
        expect(request.headers.get('Content-Type')).toContain(
          'application/json',
        )
        expect(await request.json()).toEqual({
          title: 'Taller Laravel actualizado',
        })

        return HttpResponse.json({ data: event })
      }),
      http.post(`${apiUrl}/events/7/image`, async ({ request }) => {
        const formData = await request.formData()

        expect(formData.get('image')).toMatchObject({ type: 'image/png' })

        return HttpResponse.json({
          data: {
            ...event,
            image_url: 'http://localhost:8000/storage/events/replacement.png',
          },
        })
      }),
      http.delete(`${apiUrl}/events/7/image`, () =>
        HttpResponse.json({ data: event }),
      ),
    )

    await expect(
      organizerEventsApi.update(7, { title: 'Taller Laravel actualizado' }),
    ).resolves.toEqual(event)
    await expect(
      organizerEventsApi.uploadImage(
        7,
        new File(['replacement'], 'replacement.png', { type: 'image/png' }),
      ),
    ).resolves.toMatchObject({ image_url: expect.any(String) })
    await expect(organizerEventsApi.removeImage(7)).resolves.toEqual(event)
  })
})
