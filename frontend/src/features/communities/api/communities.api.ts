import {
  type Community,
  type CommunityCreationRequest,
  type CommunityCreationRequestPage,
  type CommunityCreationRequestPayload,
  type CommunityCreationRequestStatusCode,
  type CommunityMembership,
  type CommunityMembershipPage,
  type CommunityPage,
  type MembershipStatusCode,
  communityCreationRequestEnvelopeSchema,
  communityCreationRequestPageSchema,
  communityCreationRequestPayloadSchema,
  communityEnvelopeSchema,
  communityImageFileSchema,
  communityListEnvelopeSchema,
  communityMembershipEnvelopeSchema,
  communityMembershipPageSchema,
  communityPageSchema,
  communityRejectionPayloadSchema,
} from '@/features/communities/model/community.schemas'
import { request } from '@/shared/api/client'

export type CommunityDirectoryFilters = {
  search?: string
  page?: number
  perPage?: number
}

export type CommunityCreationRequestListFilters = {
  page?: number
  perPage?: number
}

export type AdminCommunityCreationRequestFilters =
  CommunityCreationRequestListFilters & {
    status?: CommunityCreationRequestStatusCode
  }

export type CommunityRejectionPayload = {
  rejection_reason: string
}

export type CommunityMembershipRequestFilters = {
  status?: MembershipStatusCode
  page?: number
  perPage?: number
}

function appendQueryValue(
  query: URLSearchParams,
  key: string,
  value: string | number | undefined,
): void {
  if (value !== undefined && String(value).length > 0) {
    query.set(key, String(value))
  }
}

function querySuffix(query: URLSearchParams): string {
  const serializedQuery = query.toString()

  return serializedQuery.length > 0 ? `?${serializedQuery}` : ''
}

function communityPathId(communityId: number): string {
  return encodeURIComponent(String(communityId))
}

function requestPathId(requestId: number): string {
  return encodeURIComponent(String(requestId))
}

function communityPathSlug(slug: string): string {
  return encodeURIComponent(slug.trim())
}

function normalizeCreationRequestPayload(
  payload: CommunityCreationRequestPayload,
): CommunityCreationRequestPayload {
  const validatedPayload = communityCreationRequestPayloadSchema.parse(payload)

  return {
    ...validatedPayload,
    name: validatedPayload.name.trim(),
    description: validatedPayload.description?.trim() || null,
    image: validatedPayload.image ?? null,
  }
}

function buildCreationRequestFormData(
  payload: CommunityCreationRequestPayload,
): FormData {
  const formData = new FormData()

  formData.append('name', payload.name)

  if (payload.description) {
    formData.append('description', payload.description)
  }

  if (payload.image) {
    formData.append('image', payload.image)
  }

  return formData
}

export const publicCommunitiesApi = {
  listForEventFilters: async (): Promise<Community[]> =>
    communityListEnvelopeSchema.parse(await request('/communities')).data,

  discover: async (
    filters: CommunityDirectoryFilters = {},
  ): Promise<CommunityPage> => {
    const query = new URLSearchParams()

    appendQueryValue(query, 'search', filters.search?.trim())
    appendQueryValue(query, 'page', filters.page)
    appendQueryValue(query, 'per_page', filters.perPage)

    return communityPageSchema.parse(
      await request(`/communities/discover${querySuffix(query)}`),
    )
  },

  detail: async (slug: string): Promise<Community> => {
    const validSlug = slug.trim()

    if (validSlug.length === 0) {
      throw new Error('El slug de la comunidad es obligatorio.')
    }

    return communityEnvelopeSchema.parse(
      await request(`/communities/${communityPathSlug(validSlug)}`),
    ).data
  },
}

export const communityCreationRequestsApi = {
  create: async (
    payload: CommunityCreationRequestPayload,
  ): Promise<CommunityCreationRequest> => {
    const normalizedPayload = normalizeCreationRequestPayload(payload)
    const { image, ...jsonPayload } = normalizedPayload
    const body = image
      ? buildCreationRequestFormData(normalizedPayload)
      : jsonPayload

    return communityCreationRequestEnvelopeSchema.parse(
      await request('/community-creation-requests', {
        method: 'POST',
        body,
      }),
    ).data
  },

  listMine: async (
    filters: CommunityCreationRequestListFilters = {},
  ): Promise<CommunityCreationRequestPage> => {
    const query = new URLSearchParams()

    appendQueryValue(query, 'page', filters.page)
    appendQueryValue(query, 'per_page', filters.perPage)

    return communityCreationRequestPageSchema.parse(
      await request(`/me/community-creation-requests${querySuffix(query)}`),
    )
  },
}

export const dashboardCommunitiesApi = {
  list: async (): Promise<Community[]> =>
    communityListEnvelopeSchema.parse(await request('/me/communities')).data,
}

export const communityMembershipsApi = {
  requestMembership: async (
    communityId: number,
  ): Promise<CommunityMembership> =>
    communityMembershipEnvelopeSchema.parse(
      await request(
        `/communities/${communityPathId(communityId)}/membership-requests`,
        { method: 'POST' },
      ),
    ).data,

  cancelMembership: async (communityId: number): Promise<CommunityMembership> =>
    communityMembershipEnvelopeSchema.parse(
      await request(
        `/communities/${communityPathId(communityId)}/membership-requests`,
        { method: 'DELETE' },
      ),
    ).data,

  listMine: async (
    filters: CommunityCreationRequestListFilters = {},
  ): Promise<CommunityMembershipPage> => {
    const query = new URLSearchParams()

    appendQueryValue(query, 'page', filters.page)
    appendQueryValue(query, 'per_page', filters.perPage)

    return communityMembershipPageSchema.parse(
      await request(`/me/memberships${querySuffix(query)}`),
    )
  },
}

export const communityImagesApi = {
  upload: async (communityId: number, image: File): Promise<Community> => {
    const validImage = communityImageFileSchema.parse(image)
    const formData = new FormData()
    formData.append('image', validImage)

    return communityEnvelopeSchema.parse(
      await request(`/communities/${communityPathId(communityId)}/image`, {
        method: 'POST',
        body: formData,
      }),
    ).data
  },

  remove: async (communityId: number): Promise<Community> =>
    communityEnvelopeSchema.parse(
      await request(`/communities/${communityPathId(communityId)}/image`, {
        method: 'DELETE',
      }),
    ).data,
}

export const adminCommunityCreationRequestsApi = {
  list: async (
    filters: AdminCommunityCreationRequestFilters = {},
  ): Promise<CommunityCreationRequestPage> => {
    const query = new URLSearchParams()

    appendQueryValue(query, 'status', filters.status)
    appendQueryValue(query, 'page', filters.page)
    appendQueryValue(query, 'per_page', filters.perPage)

    return communityCreationRequestPageSchema.parse(
      await request(`/admin/community-creation-requests${querySuffix(query)}`),
    )
  },

  approve: async (requestId: number): Promise<CommunityCreationRequest> =>
    communityCreationRequestEnvelopeSchema.parse(
      await request(
        `/admin/community-creation-requests/${requestPathId(requestId)}/approve`,
        { method: 'PATCH' },
      ),
    ).data,

  reject: async (
    requestId: number,
    rejectionReason: string,
  ): Promise<CommunityCreationRequest> => {
    const payload: CommunityRejectionPayload =
      communityRejectionPayloadSchema.parse({
        rejection_reason: rejectionReason,
      })

    return communityCreationRequestEnvelopeSchema.parse(
      await request(
        `/admin/community-creation-requests/${requestPathId(requestId)}/reject`,
        { method: 'PATCH', body: payload },
      ),
    ).data
  },
}

function membershipPathId(membershipId: number): string {
  return encodeURIComponent(String(membershipId))
}

export const organizerMembershipsApi = {
  list: async (
    communityId: number,
    filters: CommunityMembershipRequestFilters = {},
  ): Promise<CommunityMembershipPage> => {
    const query = new URLSearchParams()

    appendQueryValue(query, 'status', filters.status)
    appendQueryValue(query, 'page', filters.page)
    appendQueryValue(query, 'per_page', filters.perPage)

    return communityMembershipPageSchema.parse(
      await request(
        `/communities/${communityPathId(communityId)}/membership-requests${querySuffix(query)}`,
      ),
    )
  },

  approve: async (membershipId: number): Promise<CommunityMembership> =>
    communityMembershipEnvelopeSchema.parse(
      await request(
        `/community-memberships/${membershipPathId(membershipId)}/approve`,
        { method: 'PATCH' },
      ),
    ).data,

  reject: async (membershipId: number): Promise<CommunityMembership> =>
    communityMembershipEnvelopeSchema.parse(
      await request(
        `/community-memberships/${membershipPathId(membershipId)}/reject`,
        { method: 'PATCH' },
      ),
    ).data,
}

/** @deprecated Use communityCreationRequestsApi.create instead. */
export const communityApi = {
  create: communityCreationRequestsApi.create,
}
