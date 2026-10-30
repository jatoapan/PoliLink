import type {
  AdminCommunityCreationRequestFilters,
  CommunityCreationRequestListFilters,
  CommunityDirectoryFilters,
  CommunityMembershipRequestFilters,
} from '@/features/communities/api/communities.api'

export const communityQueryKeys = {
  all: ['communities'] as const,
  directory: (filters: CommunityDirectoryFilters) =>
    [...communityQueryKeys.all, 'directory', filters] as const,
  detail: (slug: string) =>
    [...communityQueryKeys.all, 'detail', slug] as const,
  managed: () => [...communityQueryKeys.all, 'managed'] as const,
  creationRequestsRoot: () =>
    [...communityQueryKeys.all, 'creation-requests'] as const,
  creationRequests: (filters: CommunityCreationRequestListFilters) =>
    [...communityQueryKeys.all, 'creation-requests', filters] as const,
  membershipsRoot: () => [...communityQueryKeys.all, 'memberships'] as const,
  memberships: (filters: CommunityCreationRequestListFilters) =>
    [...communityQueryKeys.all, 'memberships', filters] as const,
  adminCreationRequestsRoot: () =>
    [...communityQueryKeys.all, 'admin-creation-requests'] as const,
  adminCreationRequests: (filters: AdminCommunityCreationRequestFilters) =>
    [...communityQueryKeys.all, 'admin-creation-requests', filters] as const,
  membershipRequestsRoot: (communityId: number) =>
    [...communityQueryKeys.all, 'membership-requests', communityId] as const,
  membershipRequests: (
    communityId: number,
    filters: CommunityMembershipRequestFilters,
  ) =>
    [
      ...communityQueryKeys.all,
      'membership-requests',
      communityId,
      filters,
    ] as const,
}
