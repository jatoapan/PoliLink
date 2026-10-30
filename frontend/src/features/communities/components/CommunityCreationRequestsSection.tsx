import { CheckCircle2, Clock3, XCircle } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import { appRoutes } from '@/app/routes'
import { useMyCommunityCreationRequests } from '@/features/communities/hooks/use-community-queries'
import type { CommunityCreationRequest } from '@/features/communities/model/community.schemas'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
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
import { Skeleton } from '@/shared/ui/skeleton'

const requestDateFormatter = new Intl.DateTimeFormat('es-EC', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

type RequestBadgeVariant = 'default' | 'secondary' | 'destructive'

type CommunityCreationRequestsSectionProps = {
  showHeader?: boolean
}

function formatRequestDate(value: string | null): string {
  if (!value) return 'Fecha no disponible'

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? 'Fecha no disponible'
    : requestDateFormatter.format(date)
}

function getRequestBadgeVariant(
  status: CommunityCreationRequest['status']['code'],
): RequestBadgeVariant {
  if (status === 'approved') return 'default'
  if (status === 'rejected') return 'destructive'

  return 'secondary'
}

function RequestStatusMessage({
  request,
}: {
  request: CommunityCreationRequest
}) {
  if (request.status.code === 'approved') {
    return (
      <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2 text-sm">
          <CheckCircle2
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-primary"
          />
          <p>La comunidad fue aprobada y ya puedes administrarla.</p>
        </div>
        <Button asChild size="sm">
          <Link to={appRoutes.myCommunities}>Ver mis comunidades</Link>
        </Button>
      </div>
    )
  }

  if (request.status.code === 'rejected') {
    return (
      <Alert variant="destructive">
        <XCircle aria-hidden="true" />
        <AlertTitle>Solicitud rechazada</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-3">
          {request.rejection_reason ||
            'La solicitud no fue aprobada. Revisa la información e inténtalo nuevamente.'}
          <Button asChild size="sm" variant="outline">
            <Link to={appRoutes.createCommunity}>Crear otra solicitud</Link>
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
      <Clock3 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <p>
        Un administrador revisará tu solicitud antes de activar la comunidad.
      </p>
    </div>
  )
}

function CommunityCreationRequestCard({
  request,
}: {
  request: CommunityCreationRequest
}) {
  return (
    <li>
      <Card className="h-full">
        <CardHeader className="gap-3 sm:flex sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>{request.name}</CardTitle>
            <CardDescription>
              {request.description || 'Sin descripción registrada.'}
            </CardDescription>
          </div>
          <Badge variant={getRequestBadgeVariant(request.status.code)}>
            {request.status.name}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Enviada el {formatRequestDate(request.requested_at)}
          </p>
          <RequestStatusMessage request={request} />
        </CardContent>
      </Card>
    </li>
  )
}

export function CommunityCreationRequestsSection({
  showHeader = true,
}: CommunityCreationRequestsSectionProps) {
  const [page, setPage] = useState(1)
  const requestsQuery = useMyCommunityCreationRequests({ page })

  if (requestsQuery.isPending) {
    return (
      <section aria-label="Mis solicitudes" className="space-y-4">
        {showHeader && (
          <div className="flex items-center gap-3">
            <Clock3
              aria-hidden="true"
              className="size-5 text-muted-foreground"
            />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        )}
        <div
          aria-label="Cargando solicitudes"
          className="grid gap-4 md:grid-cols-2"
          role="status"
        >
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </section>
    )
  }

  if (requestsQuery.isError) {
    return (
      <ApiErrorFeedback
        error={requestsQuery.error}
        isRetrying={requestsQuery.isFetching}
        onRetry={() => void requestsQuery.refetch()}
        title="No pudimos cargar tus solicitudes"
      />
    )
  }

  const requests = requestsQuery.data?.data ?? []
  const lastPage = requestsQuery.data?.meta.last_page ?? 1

  return (
    <section
      aria-label={showHeader ? undefined : 'Lista de solicitudes'}
      aria-labelledby={showHeader ? 'community-requests-title' : undefined}
      className="space-y-5"
    >
      {showHeader && (
        <div className="flex items-start gap-3">
          <Clock3
            aria-hidden="true"
            className="mt-1 size-5 text-muted-foreground"
          />
          <div>
            <h2
              className="font-heading text-xl font-medium"
              id="community-requests-title"
            >
              Mis solicitudes
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Consulta el estado de las comunidades que has propuesto registrar.
            </p>
          </div>
        </div>
      )}

      {requests.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Todavía no tienes solicitudes</CardTitle>
            <CardDescription>
              Cuando registres una comunidad, podrás seguir aquí el proceso de
              revisión.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to={appRoutes.createCommunity}>
                Registrar una comunidad
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <ul className="grid gap-4 md:grid-cols-2">
            {requests.map((request) => (
              <CommunityCreationRequestCard
                key={request.id}
                request={request}
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
      )}
    </section>
  )
}
