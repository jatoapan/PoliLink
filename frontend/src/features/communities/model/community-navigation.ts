import type { CommunityCreationRequest } from '@/features/communities/model/community.schemas'

export type CommunityRequestsNavigationState = {
  submittedRequest?: Pick<CommunityCreationRequest, 'id' | 'name'>
}
