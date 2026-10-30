import {
  type AdminEventCategory,
  type AdminEventModality,
  type AdminLocation,
  type CreateCatalogCodedResourcePayload,
  type CreateLocationPayload,
  type UpdateCatalogActivePayload,
  type UpdateCatalogNamePayload,
  type UpdateLocationPayload,
  adminEventCategoryEnvelopeSchema,
  adminEventCategoryListEnvelopeSchema,
  adminEventModalityEnvelopeSchema,
  adminEventModalityListEnvelopeSchema,
  adminLocationEnvelopeSchema,
  adminLocationListEnvelopeSchema,
  createCatalogCodedResourcePayloadSchema,
  createLocationPayloadSchema,
} from '@/features/admin/model/catalog-admin.schemas'
import { request } from '@/shared/api/client'

function resourcePathId(id: number): string {
  return encodeURIComponent(String(id))
}

export const adminEventCategoriesApi = {
  list: async (): Promise<AdminEventCategory[]> =>
    adminEventCategoryListEnvelopeSchema.parse(
      await request('/admin/catalog/event-categories'),
    ).data,

  create: async (
    payload: CreateCatalogCodedResourcePayload,
  ): Promise<AdminEventCategory> =>
    adminEventCategoryEnvelopeSchema.parse(
      await request('/admin/catalog/event-categories', {
        method: 'POST',
        body: createCatalogCodedResourcePayloadSchema.parse(payload),
      }),
    ).data,

  update: async (
    id: number,
    payload: UpdateCatalogNamePayload | UpdateCatalogActivePayload,
  ): Promise<AdminEventCategory> =>
    adminEventCategoryEnvelopeSchema.parse(
      await request(`/admin/catalog/event-categories/${resourcePathId(id)}`, {
        method: 'PATCH',
        body: payload,
      }),
    ).data,
}

export const adminEventModalitiesApi = {
  list: async (): Promise<AdminEventModality[]> =>
    adminEventModalityListEnvelopeSchema.parse(
      await request('/admin/catalog/event-modalities'),
    ).data,

  create: async (
    payload: CreateCatalogCodedResourcePayload,
  ): Promise<AdminEventModality> =>
    adminEventModalityEnvelopeSchema.parse(
      await request('/admin/catalog/event-modalities', {
        method: 'POST',
        body: createCatalogCodedResourcePayloadSchema.parse(payload),
      }),
    ).data,

  update: async (
    id: number,
    payload: UpdateCatalogNamePayload | UpdateCatalogActivePayload,
  ): Promise<AdminEventModality> =>
    adminEventModalityEnvelopeSchema.parse(
      await request(`/admin/catalog/event-modalities/${resourcePathId(id)}`, {
        method: 'PATCH',
        body: payload,
      }),
    ).data,
}

export const adminLocationsApi = {
  list: async (): Promise<AdminLocation[]> =>
    adminLocationListEnvelopeSchema.parse(
      await request('/admin/catalog/locations'),
    ).data,

  create: async (payload: CreateLocationPayload): Promise<AdminLocation> =>
    adminLocationEnvelopeSchema.parse(
      await request('/admin/catalog/locations', {
        method: 'POST',
        body: createLocationPayloadSchema.parse(payload),
      }),
    ).data,

  update: async (
    id: number,
    payload:
      | UpdateLocationPayload
      | UpdateCatalogActivePayload,
  ): Promise<AdminLocation> =>
    adminLocationEnvelopeSchema.parse(
      await request(`/admin/catalog/locations/${resourcePathId(id)}`, {
        method: 'PATCH',
        body: payload,
      }),
    ).data,
}
