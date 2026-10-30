import { Clock3, LoaderCircle, UsersRound } from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { appRoutes } from '@/app/routes'
import { useAuth } from '@/features/auth/auth-context'
import { buildAuthPath } from '@/features/auth/model/auth-helpers'
import {
  useCancelCommunityMembership,
  useRequestCommunityMembership,
} from '@/features/communities/hooks/use-community-queries'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { ApiErrorFeedback } from '@/shared/ui/api-error-feedback'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

type RequestCommunityMembershipActionProps = {
  communityId: number
  communityName: string
}

export function RequestCommunityMembershipAction({
  communityId,
  communityName,
}: RequestCommunityMembershipActionProps) {
  const { status, user } = useAuth()
  const location = useLocation()
  const requestMutation = useRequestCommunityMembership()
  const cancelMutation = useCancelCommunityMembership()

  if (status === 'loading') {
    return <Skeleton className="h-9 w-56" />
  }

  if (status !== 'authenticated') {
    return (
      <Button asChild size="sm" variant="outline">
        <Link
          to={buildAuthPath(
            appRoutes.login,
            `${location.pathname}${location.search}`,
          )}
        >
          Inicia sesión para unirte a {communityName}
        </Link>
      </Button>
    )
  }

  const membership = user?.community_memberships.find(
    (candidate) => candidate.community.id === communityId,
  )

  const handleRequest = async () => {
    try {
      await requestMutation.mutateAsync(communityId)
    } catch {
      // The mutation error is rendered below.
    }
  }

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(communityId)
    } catch {
      // The mutation error is rendered below.
    }
  }

  if (membership?.status.code === 'active') {
    if (membership.role.code === 'organizer') {
      return (
        <Badge variant="outline">
          <UsersRound aria-hidden="true" />
          Organizas esta comunidad
        </Badge>
      )
    }

    return (
      <div className="space-y-2">
        <Badge variant="outline">
          <UsersRound aria-hidden="true" />
          Ya eres miembro de {communityName}
        </Badge>
        {cancelMutation.error !== null && (
          <ApiErrorFeedback
            error={cancelMutation.error}
            isRetrying={cancelMutation.isPending}
            title="No se pudo abandonar la comunidad"
          />
        )}
        <div>
          <Button
            disabled={cancelMutation.isPending}
            onClick={() => void handleCancel()}
            size="sm"
            variant="ghost"
          >
            {cancelMutation.isPending && (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            )}
            {cancelMutation.isPending ? 'Saliendo…' : 'Abandonar comunidad'}
          </Button>
        </div>
      </div>
    )
  }

  if (membership?.status.code === 'pending') {
    return (
      <div className="space-y-2">
        <Alert>
          <Clock3 aria-hidden="true" />
          <AlertTitle>Solicitud enviada</AlertTitle>
          <AlertDescription>
            El organizador de {communityName} revisará tu solicitud.
          </AlertDescription>
        </Alert>
        {cancelMutation.error !== null && (
          <ApiErrorFeedback
            error={cancelMutation.error}
            isRetrying={cancelMutation.isPending}
            title="No se pudo cancelar la solicitud"
          />
        )}
        <Button
          disabled={cancelMutation.isPending}
          onClick={() => void handleCancel()}
          size="sm"
          variant="outline"
        >
          {cancelMutation.isPending && (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          )}
          {cancelMutation.isPending ? 'Cancelando…' : 'Cancelar solicitud'}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {requestMutation.error !== null && (
        <ApiErrorFeedback
          error={requestMutation.error}
          isRetrying={requestMutation.isPending}
          title="No se pudo enviar la solicitud"
        />
      )}
      <Button
        disabled={requestMutation.isPending}
        onClick={() => void handleRequest()}
        size="sm"
      >
        {requestMutation.isPending && (
          <LoaderCircle aria-hidden="true" className="animate-spin" />
        )}
        {requestMutation.isPending
          ? 'Enviando…'
          : `Unirme a ${communityName}`}
      </Button>
    </div>
  )
}
