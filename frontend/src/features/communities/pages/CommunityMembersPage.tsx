import { ArrowLeft, CheckCircle2, LoaderCircle, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'

import { appRoutes } from '@/app/routes'
import {
  useApproveCommunityMembership,
  useCommunityMembershipRequests,
  useManagedCommunities,
  useRejectCommunityMembership,
} from '@/features/communities/hooks/use-community-queries'
import type {
  CommunityMembership,
  MembershipStatusCode,
} from '@/features/communities/model/community.schemas'
import { ApiErrorFeedback } from '@/shared/ui/api-error-feedback'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Skeleton } from '@/shared/ui/skeleton'

const requestDateFormatter = new Intl.DateTimeFormat('es-EC', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const statusOptions: Array<{ value: MembershipStatusCode; label: string }> = [
  { value: 'pending', label: 'Pendientes' },
  { value: 'active', label: 'Activos' },
  { value: 'rejected', label: 'Rechazados' },
  { value: 'left', label: 'Retirados' },
]

function parseCommunityId(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null

  const communityId = Number(value)

  return Number.isInteger(communityId) && communityId > 0 ? communityId : null
}

function formatRequestDate(value: string | null): string {
  if (!value) return 'Fecha no disponible'

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? 'Fecha no disponible'
    : requestDateFormatter.format(date)
}

function getMembershipBadgeVariant(
  status: MembershipStatusCode,
): 'default' | 'secondary' | 'destructive' {
  if (status === 'active') return 'default'
  if (status === 'rejected') return 'destructive'

  return 'secondary'
}

function MembershipReviewActions({
  communityId,
  membership,
}: {
  communityId: number
  membership: CommunityMembership
}) {
  const approveMutation = useApproveCommunityMembership(communityId)
  const rejectMutation = useRejectCommunityMembership(communityId)
  const error = approveMutation.error ?? rejectMutation.error

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={approveMutation.isPending || rejectMutation.isPending}
          onClick={() => void approveMutation.mutateAsync(membership.id)}
          size="sm"
        >
          {approveMutation.isPending ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          ) : (
            <CheckCircle2 aria-hidden="true" />
          )}
          Aprobar
        </Button>
        <Button
          disabled={approveMutation.isPending || rejectMutation.isPending}
          onClick={() => void rejectMutation.mutateAsync(membership.id)}
          size="sm"
          variant="destructive"
        >
          {rejectMutation.isPending ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" />
          ) : (
            <XCircle aria-hidden="true" />
          )}
          Rechazar
        </Button>
      </div>
      {error !== null && error !== undefined && (
        <ApiErrorFeedback error={error} title="No se pudo revisar la solicitud" />
      )}
    </div>
  )
}

function MembershipCard({
  communityId,
  membership,
}: {
  communityId: number
  membership: CommunityMembership
}) {
  return (
    <li>
      <Card className="h-full">
        <CardHeader className="gap-3 sm:flex sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>
              {membership.requested_by
                ? `${membership.requested_by.first_name} ${membership.requested_by.last_name}`
                : 'Estudiante'}
            </CardTitle>
            <CardDescription>
              {membership.requested_by?.email ?? 'Correo no disponible'}
            </CardDescription>
          </div>
          <Badge variant={getMembershipBadgeVariant(membership.status.code)}>
            {membership.status.name}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Solicitada el {formatRequestDate(membership.requested_at)}
          </p>
          {membership.status.code === 'pending' && (
            <MembershipReviewActions
              communityId={communityId}
              membership={membership}
            />
          )}
        </CardContent>
      </Card>
    </li>
  )
}

export function CommunityMembersPage() {
  const { communityId: communityIdParam } = useParams<{
    communityId: string
  }>()
  const communityId = parseCommunityId(communityIdParam)
  const [status, setStatus] = useState<MembershipStatusCode>('pending')
  const [page, setPage] = useState(1)

  const managedCommunitiesQuery = useManagedCommunities()
  const requestsQuery = useCommunityMembershipRequests(communityId, {
    status,
    page,
  })

  if (communityId === null) {
    return (
      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl space-y-6 text-center">
          <section className="rounded-xl border border-dashed p-10">
            <h1 className="font-heading text-2xl font-medium">
              Comunidad no encontrada
            </h1>
            <Button asChild className="mt-5">
              <Link to={appRoutes.myCommunities}>Volver a mis comunidades</Link>
            </Button>
          </section>
        </div>
      </main>
    )
  }

  const community = managedCommunitiesQuery.data?.find(
    (candidate) => candidate.id === communityId,
  )
  const requests = requestsQuery.data?.data ?? []
  const lastPage = requestsQuery.data?.meta.last_page ?? 1

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <header className="space-y-5">
          <Button asChild className="-ml-2" variant="ghost">
            <Link to={appRoutes.myCommunities}>
              <ArrowLeft aria-hidden="true" />
              Volver a mis comunidades
            </Link>
          </Button>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                ESPOL · Comunidades estudiantiles
              </p>
              <h1 className="font-heading text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                {community
                  ? `Miembros de ${community.name}`
                  : 'Solicitudes de membresía'}
              </h1>
              <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                Revisa quién quiere unirse a tu comunidad y aprueba o rechaza
                cada solicitud.
              </p>
            </div>
            <div className="grid gap-2 sm:w-52">
              <Label htmlFor="membership-status-filter">Estado</Label>
              <Select
                onValueChange={(value) => {
                  setStatus(value as MembershipStatusCode)
                  setPage(1)
                }}
                value={status}
              >
                <SelectTrigger className="w-full" id="membership-status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>

        {requestsQuery.isPending && (
          <div
            aria-label="Cargando solicitudes"
            className="grid gap-4 md:grid-cols-2"
            role="status"
          >
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        )}

        {requestsQuery.isError && (
          <ApiErrorFeedback
            error={requestsQuery.error}
            isRetrying={requestsQuery.isFetching}
            messageOverrides={{
              forbidden: 'Solo el organizador de esta comunidad puede revisar sus solicitudes.',
            }}
            onRetry={() => void requestsQuery.refetch()}
            title="No pudimos cargar las solicitudes"
          />
        )}

        {!requestsQuery.isPending &&
          !requestsQuery.isError &&
          (requests.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No hay solicitudes en este estado</CardTitle>
                <CardDescription>
                  Cambia el filtro de estado para revisar otras solicitudes.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <>
              <ul className="grid gap-4 md:grid-cols-2">
                {requests.map((membership) => (
                  <MembershipCard
                    communityId={communityId}
                    key={membership.id}
                    membership={membership}
                  />
                ))}
              </ul>

              {lastPage > 1 && (
                <nav
                  aria-label="Paginación de solicitudes"
                  className="flex items-center justify-between gap-3"
                >
                  <Button
                    disabled={page === 1}
                    onClick={() => setPage((currentPage) => currentPage - 1)}
                    size="sm"
                    variant="outline"
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {page} de {lastPage}
                  </span>
                  <Button
                    disabled={page === lastPage}
                    onClick={() => setPage((currentPage) => currentPage + 1)}
                    size="sm"
                    variant="outline"
                  >
                    Siguiente
                  </Button>
                </nav>
              )}
            </>
          ))}
      </div>
    </main>
  )
}
