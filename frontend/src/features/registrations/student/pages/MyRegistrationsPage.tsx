import { Link, useSearchParams } from 'react-router'

import { appRoutes } from '@/app/routes'
import { EventPagination } from '@/features/events/catalog/components/EventPagination'
import { useMyRegistrations } from '@/features/registrations/hooks/use-registration-queries'
import { MyRegistrationsSkeleton } from '@/features/registrations/student/components/MyRegistrationsSkeleton'
import { RegistrationCard } from '@/features/registrations/student/components/RegistrationCard'
import { ApiErrorFeedback } from '@/shared/ui/api-error-feedback'
import { Button } from '@/shared/ui/button'

const myRegistrationsPerPage = 12

function parsePage(searchParams: URLSearchParams): number {
  const value = Number(searchParams.get('page') ?? '1')

  return Number.isInteger(value) && value > 0 ? value : 1
}

export function MyRegistrationsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentPage = parsePage(searchParams)
  const registrationsQuery = useMyRegistrations({
    page: currentPage,
    perPage: myRegistrationsPerPage,
  })
  const registrationPage = registrationsQuery.data

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
        <header className="max-w-2xl space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            ESPOL · Estudiante
          </p>
          <h1 className="font-heading text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
            Mis inscripciones
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Revisa los eventos en los que estás inscrito y cancela tu cupo
            cuando ya no puedas asistir.
          </p>
        </header>

        {registrationsQuery.isPending && <MyRegistrationsSkeleton />}

        {registrationsQuery.isError && (
          <ApiErrorFeedback
            error={registrationsQuery.error}
            isRetrying={registrationsQuery.isFetching}
            onRetry={() => void registrationsQuery.refetch()}
            title="No se pudieron cargar tus inscripciones"
          />
        )}

        {registrationsQuery.isSuccess &&
          registrationPage &&
          registrationPage.data.length === 0 && (
            <section className="rounded-xl border border-dashed p-10 text-center">
              <h2 className="font-heading text-xl font-medium">
                Todavía no tienes inscripciones
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
                Explora el catálogo de eventos y regístrate en las
                actividades que te interesen.
              </p>
              <Button asChild className="mt-5">
                <Link to={appRoutes.events}>Explorar eventos</Link>
              </Button>
            </section>
          )}

        {registrationsQuery.isSuccess &&
          registrationPage &&
          registrationPage.data.length > 0 && (
            <section
              aria-busy={registrationsQuery.isFetching}
              aria-labelledby="my-registrations-heading"
              className="space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                <h2
                  className="font-medium text-foreground"
                  id="my-registrations-heading"
                >
                  {registrationPage.meta.total === 1
                    ? '1 inscripción activa'
                    : `${registrationPage.meta.total} inscripciones activas`}
                </h2>
                {registrationsQuery.isFetching && <p>Actualizando…</p>}
              </div>

              <div className="grid gap-4">
                {registrationPage.data.map((registration) => (
                  <RegistrationCard
                    key={registration.id}
                    registration={registration}
                  />
                ))}
              </div>

              <EventPagination
                currentPage={registrationPage.meta.current_page}
                lastPage={registrationPage.meta.last_page}
                onPageChange={handlePageChange}
              />
            </section>
          )}
      </div>
    </main>
  )
}
