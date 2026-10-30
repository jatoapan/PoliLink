import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  adminEventCategoriesApi,
  adminEventModalitiesApi,
  adminLocationsApi,
} from '@/features/admin/api/catalog-admin.api'
import { adminCatalogQueryKeys } from '@/features/admin/model/admin-query-keys'
import type {
  CreateCatalogCodedResourcePayload,
  CreateLocationPayload,
  UpdateCatalogActivePayload,
  UpdateCatalogNamePayload,
  UpdateLocationPayload,
} from '@/features/admin/model/catalog-admin.schemas'

export function useAdminEventCategories() {
  return useQuery({
    queryKey: adminCatalogQueryKeys.eventCategories(),
    queryFn: adminEventCategoriesApi.list,
  })
}

export function useCreateAdminEventCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCatalogCodedResourcePayload) =>
      adminEventCategoriesApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminCatalogQueryKeys.eventCategories(),
      })
    },
  })
}

export function useUpdateAdminEventCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: UpdateCatalogNamePayload | UpdateCatalogActivePayload
    }) => adminEventCategoriesApi.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminCatalogQueryKeys.eventCategories(),
      })
    },
  })
}

export function useAdminEventModalities() {
  return useQuery({
    queryKey: adminCatalogQueryKeys.eventModalities(),
    queryFn: adminEventModalitiesApi.list,
  })
}

export function useCreateAdminEventModality() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateCatalogCodedResourcePayload) =>
      adminEventModalitiesApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminCatalogQueryKeys.eventModalities(),
      })
    },
  })
}

export function useUpdateAdminEventModality() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: UpdateCatalogNamePayload | UpdateCatalogActivePayload
    }) => adminEventModalitiesApi.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminCatalogQueryKeys.eventModalities(),
      })
    },
  })
}

export function useAdminLocations() {
  return useQuery({
    queryKey: adminCatalogQueryKeys.locations(),
    queryFn: adminLocationsApi.list,
  })
}

export function useCreateAdminLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateLocationPayload) =>
      adminLocationsApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminCatalogQueryKeys.locations(),
      })
    },
  })
}

export function useUpdateAdminLocation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: UpdateLocationPayload | UpdateCatalogActivePayload
    }) => adminLocationsApi.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: adminCatalogQueryKeys.locations(),
      })
    },
  })
}
