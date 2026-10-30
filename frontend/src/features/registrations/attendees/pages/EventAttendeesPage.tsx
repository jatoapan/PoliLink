import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { appRoutes } from '@/app/routes'
import { usePublicEventDetail } from '@/features/events/catalog/hooks/use-event-queries'
import { AttendeeList } from '@/features/registrations/attendees/components/AttendeeList'
import { useEventAttendees } from '@/features/registrations/hooks/use-registration-queries'
import { ApiErrorFeedback } from '@/shared/ui/api-error-feedback'
import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'

function parseEventId(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null

  const eventId = Number(value)

  return Number.isInteger(eventId) && eventId > 0 ? eventId : null
}

function BackToMyEvents() {
  return (
    <Link
      className="inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      to={appRoutes.myEvents}
    >
      <ArrowLeft aria-hidden="true" className="size-4" />
      Volver a mis eventos
    </Link>
  )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-2xl font-semibold tracking-[-0.02em]">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  )
}

export function EventAttendeesPage() {
  const { eventId: eventIdParam } = useParams<{ eventId: string }>()
  const eventId = parseEventId(eventIdParam)
  const eventQuery = usePublicEventDetail(eventId)
  const attendeesQuery = useEventAttendees(eventId)
  const eventTitle = eventQuery.data?.title ?? 'este evento'

  if (eventId === null) {
    return (
      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-4xl space-y-6 text-center">
          <BackToMyEvents />
          <section className="rounded-xl border border-dashed p-10">
            <h1 className="font-heading text-2xl font-medium">
              Evento no encontrado
            </h1>
            <p className="mt-2 text-muted-foreground">
              El evento no existe o el enlace es inválido.
            </p>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-8">
        <BackToMyEvents />

        <header className="max-w-2xl space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            ESPOL · Organización
          </p>
          <h1 className="font-heading text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Inscritos de {eventTitle}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Consulta quién se inscribió y los cupos disponibles. Esta vista
            es solo de consulta.
          </p>
        </header>

        {attendeesQuery.isPending && (
          <div aria-label="Cargando inscritos" className="space-y-4" role="status">
            <div className="grid gap-4 sm:grid-cols-3">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
            <Skeleton className="h-48 rounded-xl" />
          </div>
        )}

        {attendeesQuery.isError && (
          <ApiErrorFeedback
            error={attendeesQuery.error}
            isRetrying={attendeesQuery.isFetching}
            messageOverrides={{
              forbidden:
                'Solo el organizador responsable de este evento puede consultar la lista de inscritos.',
              not_found: 'El evento no existe o ya no está disponible.',
            }}
            onRetry={() => void attendeesQuery.refetch()}
            title="No se pudo cargar la lista de inscritos"
          />
        )}

        {attendeesQuery.isSuccess && (
          <section className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryCard
                label="Cupo total"
                value={attendeesQuery.data.summary.capacity}
              />
              <SummaryCard
                label="Inscritos activos"
                value={attendeesQuery.data.summary.active_registrations}
              />
              <SummaryCard
                label="Cupos disponibles"
                value={attendeesQuery.data.summary.available_capacity}
              />
            </div>

            {attendeesQuery.data.data.length === 0 ? (
              <section className="rounded-xl border border-dashed p-10 text-center">
                <h2 className="font-heading text-xl font-medium">
                  Aún no hay inscritos
                </h2>
                <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
                  Cuando estudiantes se inscriban en este evento, podrás
                  revisar aquí su información de contacto.
                </p>
              </section>
            ) : (
              <AttendeeList attendees={attendeesQuery.data.data} />
            )}
          </section>
        )}
      </div>
    </main>
  )
}
