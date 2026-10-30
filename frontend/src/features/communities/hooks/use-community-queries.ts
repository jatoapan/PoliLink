import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { useAuth } from '@/features/auth/auth-context'
import {
  type AdminCommunityCreationRequestFilters,
  adminCommunityCreationRequestsApi,
  type CommunityCreationRequestListFilters,
  type CommunityDirectoryFilters,
  type CommunityMembershipRequestFilters,
  communityCreationRequestsApi,
  communityImagesApi,
  communityMembershipsApi,
  dashboardCommunitiesApi,
  organizerMembershipsApi,
  publicCommunitiesApi,
} from '@/features/communities/api/communities.api'
import { communityQueryKeys } from '@/features/communities/model/community-query-keys'

export function usePublicCommunityDirectory(
  filters: CommunityDirectoryFilters = {},
) {
  return useQuery({
    queryKey: communityQueryKeys.directory(filters),
    queryFn: () => publicCommunitiesApi.discover(filters),
    placeholderData: keepPreviousData,
  })
}

export function usePublicCommunityDetail(slug: string | null) {
  return useQuery({
    queryKey: communityQueryKeys.detail(slug ?? ''),
    queryFn: () => publicCommunitiesApi.detail(slug ?? ''),
    enabled: slug !== null && slug.trim().length > 0,
  })
}

export function useManagedCommunities() {
  return useQuery({
    queryKey: communityQueryKeys.managed(),
    queryFn: dashboardCommunitiesApi.list,
  })
}

export function useMyCommunityCreationRequests(
  filters: CommunityCreationRequestListFilters = {},
) {
  return useQuery({
    queryKey: communityQueryKeys.creationRequests(filters),
    queryFn: () => communityCreationRequestsApi.listMine(filters),
    placeholderData: keepPreviousData,
  })
}

export function useSubmitCommunityCreationRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: communityCreationRequestsApi.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: communityQueryKeys.creationRequestsRoot(),
      })
    },
  })
}

export function useMyMemberships(
  filters: CommunityCreationRequestListFilters = {},
) {
  return useQuery({
    queryKey: communityQueryKeys.memberships(filters),
    queryFn: () => communityMembershipsApi.listMine(filters),
    placeholderData: keepPreviousData,
  })
}

export function useRequestCommunityMembership() {
  const queryClient = useQueryClient()
  const { refresh } = useAuth()

  return useMutation({
    mutationFn: communityMembershipsApi.requestMembership,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: communityQueryKeys.membershipsRoot(),
        }),
        refresh(),
      ])
    },
  })
}

export function useCancelCommunityMembership() {
  const queryClient = useQueryClient()
  const { refresh } = useAuth()

  return useMutation({
    mutationFn: communityMembershipsApi.cancelMembership,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: communityQueryKeys.membershipsRoot(),
        }),
        refresh(),
      ])
    },
  })
}

export function useUploadCommunityImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      communityId,
      image,
    }: {
      communityId: number
      image: File
    }) => communityImagesApi.upload(communityId, image),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: communityQueryKeys.all,
      })
    },
  })
}

export function useRemoveCommunityImage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: communityImagesApi.remove,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: communityQueryKeys.all,
      })
    },
  })
}

export function useAdminCommunityCreationRequests(
  filters: AdminCommunityCreationRequestFilters = {},
) {
  return useQuery({
    queryKey: communityQueryKeys.adminCreationRequests(filters),
    queryFn: () => adminCommunityCreationRequestsApi.list(filters),
    placeholderData: keepPreviousData,
  })
}

export function useApproveCommunityCreationRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminCommunityCreationRequestsApi.approve,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: communityQueryKeys.all,
      })
    },
  })
}

export function useRejectCommunityCreationRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      requestId,
      rejectionReason,
    }: {
      requestId: number
      rejectionReason: string
    }) => adminCommunityCreationRequestsApi.reject(requestId, rejectionReason),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: communityQueryKeys.all,
      })
    },
  })
}

export function useCreateCommunity() {
  return useSubmitCommunityCreationRequest()
}

export function useCommunityMembershipRequests(
  communityId: number | null,
  filters: CommunityMembershipRequestFilters = {},
) {
  return useQuery({
    queryKey: communityQueryKeys.membershipRequests(communityId ?? 0, filters),
    queryFn: () => organizerMembershipsApi.list(communityId ?? 0, filters),
    enabled: communityId !== null,
    placeholderData: keepPreviousData,
  })
}

export function useApproveCommunityMembership(communityId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: organizerMembershipsApi.approve,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: communityQueryKeys.membershipRequestsRoot(communityId),
      })
    },
  })
}

export function useRejectCommunityMembership(communityId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: organizerMembershipsApi.reject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: communityQueryKeys.membershipRequestsRoot(communityId),
      })
    },
  })
}
