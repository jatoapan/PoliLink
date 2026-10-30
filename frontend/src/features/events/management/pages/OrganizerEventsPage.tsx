import { ArrowLeft, CheckCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'

import { appRoutes } from '@/app/routes'
import { EventPagination } from '@/features/events/catalog/components/EventPagination'
import { ManagedEventCard } from '@/features/events/management/components/ManagedEventCard'
import { ManagedEventSkeleton } from '@/features/events/management/components/ManagedEventSkeleton'
import { useOrganizerEvents } from '@/features/organizer/hooks/use-organizer-queries'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { ApiErrorFeedback } from '@/shared/ui/api-error-feedback'
import { Button } from '@/shared/ui/button'

const organizerEventsPerPage = 12

function parsePage(searchParams: URLSearchParams): number {
  const value = Number(searchParams.get('page') ?? '1')

  return Number.isInteger(value) && value > 0 ? value : 1
}

type EventNotice = {
  action: 'created' | 'updated'
  title: string
}

function readEventNotice(state: unknown): EventNotice | null {
  if (!state || typeof state !== 'object') return null

  const stateRecord = state as {
    createdEventTitle?: unknown
    eventNotice?: unknown
  }
  const notice = stateRecord.eventNotice

  if (notice && typeof notice === 'object') {
    const noticeRecord = notice as {
      action?: unknown
      title?: unknown
    }

    const action = noticeRecord.action
    const title = noticeRecord.title

    if (
      (action === 'created' || action === 'updated') &&
      typeof title === 'string'
    ) {
      return {
        action,
        title,
      }
    }
  }

  const createdEventTitle = stateRecord.createdEventTitle

  return typeof createdEventTitle === 'string'
    ? { action: 'created', title: createdEventTitle }
    : null
}

export function OrganizerEventsPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [eventNotice] = useState(() => readEventNotice(location.state))
  const currentPage = parsePage(searchParams)
  const eventsQuery = useOrganizerEvents({
    page: currentPage,
    perPage: organizerEventsPerPage,
  })
  const eventPage = eventsQuery.data

  useEffect(() => {
    if (eventNotice === null || location.state === null) return

    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: null,
    })
  }, [eventNotice, location, navigate])

  const handlePageChange = (page: number) => {
    const nextSearchParams = new URLSearchParams(searchParams)

    if (page === 1) nextSearchParams.delete('page')
    else nextSearchParams.set('page', String(page))

    setSearchParams(nextSearchParams)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <Link
          className="inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          to={appRoutes.myCommunities}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Volver a mis comunidades
        </Link>

        <header className="max-w-2xl space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            ESPOL · Organización
          </p>
          <h1 className="font-heading text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Mis eventos
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Revisa las actividades publicadas por las comunidades que
            administras.
          </p>
          <Button asChild>
            <Link to={appRoutes.createEvent}>Crear evento</Link>
          </Button>
        </header>

        {eventNotice !== null && (
          <Alert>
            <CheckCircle aria-hidden="true" />
            <AlertTitle>
              {eventNotice.action === 'created'
                ? 'Evento publicado correctamente'
                : 'Evento actualizado correctamente'}
            </AlertTitle>
            <AlertDescription>
              {eventNotice.action === 'created'
                ? `“${eventNotice.title}” ya está disponible para los estudiantes.`
                : `“${eventNotice.title}” conserva su publicación con la información actualizada.`}
            </AlertDescription>
          </Alert>
        )}

        {eventsQuery.isPending && <ManagedEventSkeleton />}

        {eventsQuery.isError && (
          <ApiErrorFeedback
            error={eventsQuery.error}
            isRetrying={eventsQuery.isFetching}
            messageOverrides={{
              forbidden: 'No tienes permisos para consultar estos eventos.',
            }}
            onRetry={() => void eventsQuery.refetch()}
            title="No se pudieron cargar tus eventos"
          />
        )}

        {eventsQuery.isSuccess && eventPage && eventPage.data.length === 0 && (
          <section className="rounded-xl border border-dashed p-10 text-center">
            <h2 className="font-heading text-xl font-medium">
              Aún no tienes eventos
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
              Cuando publiques una actividad, podrás revisar aquí su estado,
              comunidad y disponibilidad de cupos.
            </p>
            <Button asChild className="mt-5" variant="outline">
              <Link to={appRoutes.createEvent}>Crear evento</Link>
            </Button>
            <Button asChild className="mt-2 sm:ml-2" variant="outline">
              <Link to={appRoutes.myCommunities}>Ver mis comunidades</Link>
            </Button>
          </section>
        )}

        {eventsQuery.isSuccess && eventPage && eventPage.data.length > 0 && (
          <section
            aria-busy={eventsQuery.isFetching}
            aria-labelledby="managed-events-heading"
            className="space-y-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <h2
                className="font-medium text-foreground"
                id="managed-events-heading"
              >
                {eventPage.meta.total === 1
                  ? '1 evento en tu historial'
                  : `${eventPage.meta.total} eventos en tu historial`}
              </h2>
              {eventsQuery.isFetching && <p>Actualizando resultados…</p>}
            </div>

            <div className="grid gap-4">
              {eventPage.data.map((event) => (
                <ManagedEventCard event={event} key={event.id} />
              ))}
            </div>

            <EventPagination
              currentPage={eventPage.meta.current_page}
              lastPage={eventPage.meta.last_page}
              onPageChange={handlePageChange}
            />
          </section>
        )}
      </div>
    </main>
  )
}
