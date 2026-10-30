import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'

import {
  adminCommunityCreationRequestsApi,
  communityCreationRequestsApi,
  communityImagesApi,
  communityMembershipsApi,
  dashboardCommunitiesApi,
  organizerMembershipsApi,
  publicCommunitiesApi,
} from '@/features/communities/api/communities.api'
import { server } from '@/test/server'

const apiUrl = 'http://localhost:8000/api'

const community = {
  id: 4,
  name: 'Club de Robótica',
  slug: 'club-de-robotica',
  description: 'Comunidad de robótica de ESPOL.',
  image_url: null,
}

const communityRequest = {
  id: 8,
  name: community.name,
  slug: community.slug,
  description: community.description,
  image_url: null,
  status: { code: 'pending', name: 'Pendiente' },
  requested_at: '2026-08-16T20:00:00.000000Z',
  reviewed_at: null,
  rejection_reason: null,
}

const membership = {
  id: 12,
  community,
  role: { code: 'member', name: 'Miembro' },
  status: { code: 'pending', name: 'Pendiente' },
  requested_at: '2026-08-16T20:00:00.000000Z',
  reviewed_at: null,
}

function page<T>(data: T[]) {
  return {
    data,
    links: {
      first: `${apiUrl}/resource?page=1`,
      last: `${apiUrl}/resource?page=1`,
      prev: null,
      next: null,
    },
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: 12,
      total: data.length,
    },
  }
}

describe('community API', () => {
  it('submits a creation request as JSON when there is no image', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'

    server.use(
      http.post(
        `${apiUrl}/community-creation-requests`,
        async ({ request }) => {
          expect(request.headers.get('Content-Type')).toContain(
            'application/json',
          )
          expect(await request.json()).toEqual({
            description: 'Comunidad de robótica de ESPOL.',
            name: 'Club de Robótica',
          })

          return HttpResponse.json({ data: communityRequest }, { status: 201 })
        },
      ),
    )

    await expect(
      communityCreationRequestsApi.create({
        description: 'Comunidad de robótica de ESPOL.',
        name: '  Club de Robótica  ',
      }),
    ).resolves.toEqual(communityRequest)
  })

  it('submits a creation request as FormData when it includes an image', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    const image = new File(['logo'], 'logo.webp', { type: 'image/webp' })
    const response = {
      ...communityRequest,
      image_url: 'http://localhost:8000/storage/community-requests/logo.webp',
    }

    server.use(
      http.post(
        `${apiUrl}/community-creation-requests`,
        async ({ request }) => {
          expect(request.headers.get('Content-Type')).toMatch(
            /^multipart\/form-data; boundary=/,
          )

          const formData = await request.formData()

          expect(formData.get('name')).toBe('Club de Robótica')
          expect(formData.get('description')).toBe(
            'Comunidad de robótica de ESPOL.',
          )
          expect(formData.get('image')).toMatchObject({
            type: 'image/webp',
          })

          return HttpResponse.json({ data: response }, { status: 201 })
        },
      ),
    )

    await expect(
      communityCreationRequestsApi.create({
        description: community.description,
        image,
        name: community.name,
      }),
    ).resolves.toEqual(response)
  })

  it('parses public directory, profile, and event-filter communities', async () => {
    server.use(
      http.get(`${apiUrl}/communities/discover`, ({ request }) => {
        const query = new URL(request.url).searchParams

        expect(query.get('search')).toBe('robotica')
        expect(query.get('page')).toBe('2')
        expect(query.get('per_page')).toBe('12')

        return HttpResponse.json(page([community]))
      }),
      http.get(`${apiUrl}/communities/${community.slug}`, () =>
        HttpResponse.json({ data: community }),
      ),
      http.get(`${apiUrl}/communities`, () =>
        HttpResponse.json({ data: [community] }),
      ),
    )

    await expect(
      publicCommunitiesApi.discover({
        page: 2,
        perPage: 12,
        search: 'robotica',
      }),
    ).resolves.toMatchObject({ data: [community] })
    await expect(publicCommunitiesApi.detail(community.slug)).resolves.toEqual(
      community,
    )
    await expect(publicCommunitiesApi.listForEventFilters()).resolves.toEqual([
      community,
    ])
  })

  it('parses the authenticated managed communities collection', async () => {
    server.use(
      http.get(`${apiUrl}/me/communities`, () =>
        HttpResponse.json({ data: [community] }),
      ),
    )

    await expect(dashboardCommunitiesApi.list()).resolves.toEqual([community])
  })

  it('uses numeric community IDs for memberships and images', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    const image = new File(['logo'], 'logo.png', { type: 'image/png' })

    server.use(
      http.post(`${apiUrl}/communities/4/membership-requests`, () =>
        HttpResponse.json({ data: membership }, { status: 201 }),
      ),
      http.delete(`${apiUrl}/communities/4/membership-requests`, () =>
        HttpResponse.json({ data: membership }),
      ),
      http.get(`${apiUrl}/me/memberships`, () =>
        HttpResponse.json(page([membership])),
      ),
      http.post(`${apiUrl}/communities/4/image`, async ({ request }) => {
        expect(request.headers.get('Content-Type')).toMatch(
          /^multipart\/form-data; boundary=/,
        )
        expect((await request.formData()).get('image')).toMatchObject({
          type: 'image/png',
        })

        return HttpResponse.json({ data: community })
      }),
      http.delete(`${apiUrl}/communities/4/image`, () =>
        HttpResponse.json({ data: community }),
      ),
    )

    await expect(communityMembershipsApi.requestMembership(4)).resolves.toEqual(
      membership,
    )
    await expect(communityMembershipsApi.cancelMembership(4)).resolves.toEqual(
      membership,
    )
    await expect(communityMembershipsApi.listMine()).resolves.toMatchObject({
      data: [membership],
    })
    await expect(communityImagesApi.upload(4, image)).resolves.toEqual(
      community,
    )
    await expect(communityImagesApi.remove(4)).resolves.toEqual(community)
  })

  it('lists, approves, and rejects community requests as an admin', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    const approvedRequest = {
      ...communityRequest,
      status: { code: 'approved', name: 'Aprobada' },
      community,
    }
    const rejectedRequest = {
      ...communityRequest,
      status: { code: 'rejected', name: 'Rechazada' },
      rejection_reason: 'La comunidad ya tiene un canal institucional.',
    }

    server.use(
      http.get(`${apiUrl}/admin/community-creation-requests`, ({ request }) => {
        const query = new URL(request.url).searchParams

        expect(query.get('status')).toBe('pending')
        expect(query.get('per_page')).toBe('12')

        return HttpResponse.json(page([communityRequest]))
      }),
      http.patch(`${apiUrl}/admin/community-creation-requests/8/approve`, () =>
        HttpResponse.json({ data: approvedRequest }),
      ),
      http.patch(
        `${apiUrl}/admin/community-creation-requests/8/reject`,
        async ({ request }) => {
          expect(await request.json()).toEqual({
            rejection_reason: 'La comunidad ya tiene un canal institucional.',
          })

          return HttpResponse.json({ data: rejectedRequest })
        },
      ),
    )

    await expect(
      adminCommunityCreationRequestsApi.list({
        perPage: 12,
        status: 'pending',
      }),
    ).resolves.toMatchObject({ data: [communityRequest] })
    await expect(adminCommunityCreationRequestsApi.approve(8)).resolves.toEqual(
      approvedRequest,
    )
    await expect(
      adminCommunityCreationRequestsApi.reject(
        8,
        'La comunidad ya tiene un canal institucional.',
      ),
    ).resolves.toEqual(rejectedRequest)
  })

  it('lists, approves, and rejects membership requests as a community organizer', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-token; path=/'
    const approvedMembership = {
      ...membership,
      status: { code: 'active', name: 'Activa' },
    }
    const rejectedMembership = {
      ...membership,
      id: 13,
      status: { code: 'rejected', name: 'Rechazada' },
    }

    server.use(
      http.get(`${apiUrl}/communities/4/membership-requests`, ({ request }) => {
        const query = new URL(request.url).searchParams

        expect(query.get('status')).toBe('pending')
        expect(query.get('per_page')).toBe('12')

        return HttpResponse.json(page([membership]))
      }),
      http.patch(`${apiUrl}/community-memberships/12/approve`, () =>
        HttpResponse.json({ data: approvedMembership }),
      ),
      http.patch(`${apiUrl}/community-memberships/13/reject`, () =>
        HttpResponse.json({ data: rejectedMembership }),
      ),
    )

    await expect(
      organizerMembershipsApi.list(4, { perPage: 12, status: 'pending' }),
    ).resolves.toMatchObject({ data: [membership] })
    await expect(organizerMembershipsApi.approve(12)).resolves.toEqual(
      approvedMembership,
    )
    await expect(organizerMembershipsApi.reject(13)).resolves.toEqual(
      rejectedMembership,
    )
  })
})
