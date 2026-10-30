import {
  ArrowRight,
  ArrowUpRight,
  Compass,
  Search,
  UsersRound,
} from 'lucide-react'
import { Link } from 'react-router'

import { appRoutes } from '@/app/routes'
import { CommunityCard } from '@/features/communities/components/CommunityCard'
import { usePublicCommunityDirectory } from '@/features/communities/hooks/use-community-queries'
import { EventCard } from '@/features/events/catalog/components/EventCard'
import { usePublicEventCatalog } from '@/features/events/catalog/hooks/use-event-queries'
import type { CatalogFilters } from '@/features/events/catalog/model/catalog-filters'
import { ApiErrorFeedback } from '@/shared/ui/api-error-feedback'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent } from '@/shared/ui/card'
import { Skeleton } from '@/shared/ui/skeleton'

const landingPreviewPageSize = 3
const landingSkeletonKeys = ['first', 'second', 'third'] as const

const landingEventFilters: CatalogFilters = {
  search: '',
  date: '',
  category: '',
  modality: '',
  communityId: null,
  page: 1,
}

const landingSteps = [
  {
    number: '01',
    title: 'Descubre',
    description: 'Encuentra eventos y comunidades que conecten contigo.',
  },
  {
    number: '02',
    title: 'Participa',
    description: 'Regístrate en actividades y reserva tu lugar.',
  },
  {
    number: '03',
    title: 'Conecta',
    description: 'Forma parte de la vida estudiantil de ESPOL.',
  },
] as const

type LandingSectionHeaderProps = {
  eyebrow: string
  title: string
  titleId: string
  description: string
  actionLabel: string
  actionTo: string
}

function LandingSectionHeader({
  eyebrow,
  title,
  titleId,
  description,
  actionLabel,
  actionTo,
}: LandingSectionHeaderProps) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl space-y-3">
        <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
        <h2
          className="font-heading text-3xl font-semibold tracking-[-0.04em] sm:text-4xl"
          id={titleId}
        >
          {title}
        </h2>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          {description}
        </p>
      </div>
      <Button asChild className="w-fit" variant="outline">
        <Link to={actionTo}>
          {actionLabel}
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </header>
  )
}

type LandingMetricProps = {
  label: string
  value: number | undefined
  isLoading: boolean
  hasError: boolean
}

function LandingMetric({
  label,
  value,
  isLoading,
  hasError,
}: LandingMetricProps) {
  return (
    <div className="space-y-1 border-l border-border pl-4 first:border-l-0 first:pl-0">
      {isLoading ? (
        <Skeleton aria-hidden="true" className="h-9 w-16" />
      ) : (
        <p className="font-heading text-3xl font-semibold tracking-[-0.04em]">
          {hasError ? '—' : (value ?? 0)}
        </p>
      )}
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function LandingCardsSkeleton({ label }: { label: string }) {
  return (
    <div
      aria-label={`Cargando ${label}`}
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      role="status"
    >
      {landingSkeletonKeys.map((skeletonKey) => (
        <Card className="overflow-hidden p-0" key={skeletonKey}>
          <Skeleton className="aspect-[16/9] rounded-none" />
          <CardContent className="space-y-3 p-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function LandingEmptyState({
  description,
  title,
  to,
}: {
  description: string
  title: string
  to: string
}) {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center sm:p-10">
      <h3 className="font-heading text-xl font-medium">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <Button asChild className="mt-5" variant="outline">
        <Link to={to}>
          Explorar catálogo
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </div>
  )
}

function LandingHero() {
  return (
    <section
      aria-labelledby="landing-title"
      className="overflow-hidden bg-primary text-primary-foreground"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-28">
        <div className="max-w-3xl space-y-7">
          <Badge className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground">
            ESPOL · Comunidades estudiantiles
          </Badge>
          <div className="space-y-5">
            <h1
              className="font-heading text-5xl leading-[0.98] font-semibold tracking-[-0.07em] sm:text-7xl"
              id="landing-title"
            >
              Vive ESPOL a través de sus{' '}
              <span className="underline decoration-primary-foreground/40 decoration-2 underline-offset-8">
                comunidades
              </span>
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-primary-foreground/75 sm:text-xl">
              Descubre eventos, talleres y actividades publicados por las
              comunidades estudiantiles. Encuentra tu próximo espacio para
              aprender, participar y conectar.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to={appRoutes.events}>
                Explorar eventos
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
            <Button
              asChild
              className="border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              size="lg"
              variant="outline"
            >
              <Link to={appRoutes.communities}>Ver comunidades</Link>
            </Button>
          </div>
        </div>

        <Card className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground shadow-none">
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary-foreground/10">
              <Compass aria-hidden="true" className="size-6" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary-foreground/65">
                Tu campus, tus espacios
              </p>
              <h2 className="font-heading text-2xl font-semibold tracking-[-0.04em]">
                Encuentra algo para ti
              </h2>
              <p className="leading-relaxed text-primary-foreground/70">
                Explora el catálogo público y descubre qué está pasando en las
                comunidades de ESPOL.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <Link
                className="group flex items-center justify-between rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 p-4 transition-colors hover:bg-primary-foreground/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
                to={appRoutes.events}
              >
                <span className="flex items-center gap-3">
                  <Search aria-hidden="true" className="size-4" />
                  <span className="text-sm font-medium">Buscar eventos</span>
                </span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
              <Link
                className="group flex items-center justify-between rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 p-4 transition-colors hover:bg-primary-foreground/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground"
                to={appRoutes.communities}
              >
                <span className="flex items-center gap-3">
                  <UsersRound aria-hidden="true" className="size-4" />
                  <span className="text-sm font-medium">
                    Conocer comunidades
                  </span>
                </span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function LandingSteps() {
  return (
    <section
      aria-labelledby="landing-steps-title"
      className="border-y border-border bg-muted/30"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mb-10 max-w-2xl space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            Una experiencia simple
          </p>
          <h2
            className="font-heading text-3xl font-semibold tracking-[-0.04em] sm:text-4xl"
            id="landing-steps-title"
          >
            Así funciona PoliLink
          </h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3 md:gap-6">
          {landingSteps.map((step) => (
            <article className="space-y-4" key={step.number}>
              <p className="font-heading text-sm font-semibold text-muted-foreground">
                {step.number}
              </p>
              <div className="h-px w-full bg-border" />
              <h3 className="font-heading text-xl font-semibold tracking-[-0.03em]">
                {step.title}
              </h3>
              <p className="leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function LandingOrganizerCallout() {
  return (
    <section aria-labelledby="landing-organizer-title">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-6 py-12 text-primary-foreground sm:px-12 sm:py-16">
          <div className="relative z-10 max-w-2xl space-y-5">
            <p className="text-sm font-medium text-primary-foreground/65">
              Para quienes hacen comunidad
            </p>
            <h2
              className="font-heading text-3xl font-semibold tracking-[-0.05em] sm:text-5xl"
              id="landing-organizer-title"
            >
              ¿Organizas una comunidad?
            </h2>
            <p className="max-w-xl text-lg leading-relaxed text-primary-foreground/75">
              Publica tus actividades y ayuda a que más estudiantes encuentren
              un espacio donde participar.
            </p>
            <Button asChild size="lg" variant="secondary">
              <Link to={appRoutes.organize}>
                Organizar una comunidad
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

export function LandingPage() {
  const eventsQuery = usePublicEventCatalog(landingEventFilters, {
    perPage: landingPreviewPageSize,
  })
  const communitiesQuery = usePublicCommunityDirectory({
    page: 1,
    perPage: landingPreviewPageSize,
  })

  const eventPage = eventsQuery.data
  const communityPage = communitiesQuery.data

  return (
    <main className="min-h-[calc(100vh-73px)] overflow-hidden">
      <LandingHero />

      <section
        aria-label="Resumen de PoliLink"
        className="border-b border-border bg-background"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:px-8">
          <LandingMetric
            hasError={eventsQuery.isError}
            isLoading={eventsQuery.isPending}
            label="eventos publicados"
            value={eventPage?.meta.total}
          />
          <LandingMetric
            hasError={communitiesQuery.isError}
            isLoading={communitiesQuery.isPending}
            label="comunidades activas"
            value={communityPage?.meta.total}
          />
        </div>
      </section>

      <section
        aria-labelledby="landing-events-title"
        className="bg-background"
        id="eventos-destacados"
      >
        <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <LandingSectionHeader
            actionLabel="Ver todos los eventos"
            actionTo={appRoutes.events}
            description="Encuentra talleres, actividades y encuentros publicados por las comunidades de ESPOL."
            eyebrow="Descubrimiento público"
            title="Explora lo que está pasando"
            titleId="landing-events-title"
          />

          <div aria-busy={eventsQuery.isFetching}>
            {eventsQuery.isPending && (
              <LandingCardsSkeleton label="los eventos" />
            )}
            {eventsQuery.isError && (
              <ApiErrorFeedback
                error={eventsQuery.error}
                isRetrying={eventsQuery.isFetching}
                onRetry={() => void eventsQuery.refetch()}
                title="No se pudieron cargar los eventos"
              />
            )}
            {eventsQuery.isSuccess && eventPage?.data.length === 0 && (
              <LandingEmptyState
                description="Cuando una comunidad publique una actividad, aparecerá aquí para que puedas descubrirla."
                title="Todavía no hay eventos publicados"
                to={appRoutes.events}
              />
            )}
            {eventsQuery.isSuccess && eventPage && eventPage.data.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {eventPage.data.map((event) => (
                  <EventCard event={event} key={event.id} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="landing-communities-title"
        className="border-y border-border bg-muted/30"
        id="comunidades-destacadas"
      >
        <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <LandingSectionHeader
            actionLabel="Ver todas las comunidades"
            actionTo={appRoutes.communities}
            description="Conoce los clubes y organizaciones estudiantiles activos en PoliLink."
            eyebrow="Conexiones que importan"
            title="Comunidades con las que puedes conectar"
            titleId="landing-communities-title"
          />

          <div aria-busy={communitiesQuery.isFetching}>
            {communitiesQuery.isPending && (
              <LandingCardsSkeleton label="las comunidades" />
            )}
            {communitiesQuery.isError && (
              <ApiErrorFeedback
                error={communitiesQuery.error}
                isRetrying={communitiesQuery.isFetching}
                onRetry={() => void communitiesQuery.refetch()}
                title="No se pudieron cargar las comunidades"
              />
            )}
            {communitiesQuery.isSuccess &&
              communityPage?.data.length === 0 && (
                <LandingEmptyState
                  description="Las comunidades activas aparecerán aquí para que puedas conocer sus actividades y propuestas."
                  title="Todavía no hay comunidades para explorar"
                  to={appRoutes.communities}
                />
              )}
            {communitiesQuery.isSuccess &&
              communityPage &&
              communityPage.data.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {communityPage.data.map((community) => (
                    <CommunityCard community={community} key={community.id} />
                  ))}
                </div>
              )}
          </div>
        </div>
      </section>

      <LandingSteps />
      <LandingOrganizerCallout />
    </main>
  )
}
