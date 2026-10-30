import { ArrowLeft, CheckCircle2, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import { appRoutes } from '@/app/routes'
import { RejectCommunityRequestDialog } from '@/features/admin/components/RejectCommunityRequestDialog'
import {
  useAdminCommunityCreationRequests,
  useApproveCommunityCreationRequest,
} from '@/features/communities/hooks/use-community-queries'
import type {
  CommunityCreationRequest,
  CommunityCreationRequestStatusCode,
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

const statusOptions: Array<{
  value: CommunityCreationRequestStatusCode
  label: string
}> = [
  { value: 'pending', label: 'Pendientes' },
  { value: 'approved', label: 'Aprobadas' },
  { value: 'rejected', label: 'Rechazadas' },
]

function formatRequestDate(value: string | null): string {
  if (!value) return 'Fecha no disponible'

  const date = new Date(value)

  return Number.isNaN(date.getTime())
    ? 'Fecha no disponible'
    : requestDateFormatter.format(date)
}

function ApproveRequestButton({
  request,
}: {
  request: CommunityCreationRequest
}) {
  const approveMutation = useApproveCommunityCreationRequest()

  return (
    <div className="space-y-2">
      <Button
        disabled={approveMutation.isPending}
        onClick={() => void approveMutation.mutateAsync(request.id)}
        size="sm"
      >
        {approveMutation.isPending ? (
          <LoaderCircle aria-hidden="true" className="animate-spin" />
        ) : (
          <CheckCircle2 aria-hidden="true" />
        )}
        Aprobar
      </Button>
      {approveMutation.error && (
        <ApiErrorFeedback
          error={approveMutation.error}
          isRetrying={approveMutation.isPending}
          onRetry={() => void approveMutation.mutateAsync(request.id)}
          title="No se pudo aprobar la solicitud"
        />
      )}
    </div>
  )
}

function RequestCard({ request }: { request: CommunityCreationRequest }) {
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
          <Badge
            variant={
              request.status.code === 'approved'
                ? 'default'
                : request.status.code === 'rejected'
                  ? 'destructive'
                  : 'secondary'
            }
          >
            {request.status.name}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1 text-sm text-muted-foreground">
            {request.requested_by && (
              <p>
                Solicitado por {request.requested_by.first_name}{' '}
                {request.requested_by.last_name} ·{' '}
                <span className="text-xs">{request.requested_by.email}</span>
              </p>
            )}
            <p className="text-xs">
              Enviada el {formatRequestDate(request.requested_at)}
            </p>
            {request.reviewed_at && (
              <p className="text-xs">
                Revisada el {formatRequestDate(request.reviewed_at)}
              </p>
            )}
          </div>

          {request.status.code === 'rejected' && request.rejection_reason && (
            <p className="rounded-lg border bg-muted/30 p-3 text-sm">
              Motivo: {request.rejection_reason}
            </p>
          )}

          {request.status.code === 'pending' && (
            <div className="flex flex-wrap gap-2">
              <ApproveRequestButton request={request} />
              <RejectCommunityRequestDialog request={request} />
            </div>
          )}
        </CardContent>
      </Card>
    </li>
  )
}

export function AdminCommunityRequestsPage() {
  const [status, setStatus] =
    useState<CommunityCreationRequestStatusCode>('pending')
  const [page, setPage] = useState(1)
  const requestsQuery = useAdminCommunityCreationRequests({ status, page })

  const requests = requestsQuery.data?.data ?? []
  const lastPage = requestsQuery.data?.meta.last_page ?? 1

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <header className="space-y-5">
          <Button asChild className="-ml-2" variant="ghost">
            <Link to={appRoutes.admin}>
              <ArrowLeft aria-hidden="true" />
              Volver a administración
            </Link>
          </Button>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                ESPOL · Administración
              </p>
              <h1 className="font-heading text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                Solicitudes de comunidades
              </h1>
              <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                Revisa las comunidades propuestas por estudiantes y aprueba o
                rechaza su publicación.
              </p>
            </div>
            <div className="grid gap-2 sm:w-52">
              <Label htmlFor="status-filter">Estado</Label>
              <Select
                onValueChange={(value) => {
                  setStatus(value as CommunityCreationRequestStatusCode)
                  setPage(1)
                }}
                value={status}
              >
                <SelectTrigger className="w-full" id="status-filter">
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
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
        )}

        {requestsQuery.isError && (
          <ApiErrorFeedback
            error={requestsQuery.error}
            isRetrying={requestsQuery.isFetching}
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
                {requests.map((request) => (
                  <RequestCard key={request.id} request={request} />
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
