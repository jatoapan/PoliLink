import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { appRoutes } from '@/app/routes'
import { RequestCommunityMembershipAction } from '@/features/communities/components/RequestCommunityMembershipAction'
import { usePublicCommunityDetail } from '@/features/communities/hooks/use-community-queries'
import { EventImage } from '@/features/events/components/EventImage'
import { ApiError } from '@/shared/errors/api-error'
import { ApiErrorFeedback } from '@/shared/ui/api-error-feedback'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

function BackToDirectory() {
  return (
    <Button asChild className="-ml-2" variant="ghost">
      <Link to={appRoutes.communities}>
        <ArrowLeft aria-hidden="true" />
        Volver a comunidades
      </Link>
    </Button>
  )
}

function CommunityNotFound() {
  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-2xl space-y-6 text-center">
        <BackToDirectory />
        <section className="rounded-xl border border-dashed p-10">
          <h1 className="font-heading text-2xl font-medium">
            Comunidad no encontrada
          </h1>
          <p className="mt-2 text-muted-foreground">
            La comunidad no existe o ya no está activa.
          </p>
          <Button asChild className="mt-5">
            <Link to={appRoutes.communities}>Explorar comunidades</Link>
          </Button>
        </section>
      </div>
    </main>
  )
}

export function CommunityDetailPage() {
  const { communitySlug } = useParams<{ communitySlug: string }>()
  const detailQuery = usePublicCommunityDetail(communitySlug ?? null)

  if (!communitySlug) {
    return <CommunityNotFound />
  }

  if (detailQuery.isPending) {
    return (
      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl space-y-8">
          <BackToDirectory />
          <Skeleton className="aspect-video w-full rounded-xl" />
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </main>
    )
  }

  if (detailQuery.isError) {
    if (
      detailQuery.error instanceof ApiError &&
      detailQuery.error.kind === 'not_found'
    ) {
      return <CommunityNotFound />
    }

    return (
      <main className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-3xl space-y-8">
          <BackToDirectory />
          <ApiErrorFeedback
            error={detailQuery.error}
            isRetrying={detailQuery.isFetching}
            onRetry={() => void detailQuery.refetch()}
            title="No se pudo cargar la comunidad"
          />
        </div>
      </main>
    )
  }

  const community = detailQuery.data

  if (!community) return <CommunityNotFound />

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <BackToDirectory />

        <article className="space-y-6">
          <EventImage
            alt={`Imagen de ${community.name}`}
            className="rounded-xl lg:aspect-[3/1]"
            imageUrl={community.image_url}
          />

          <header className="space-y-4">
            <h1 className="font-heading text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {community.name}
            </h1>
            <p className="max-w-3xl whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
              {community.description ??
                'Esta comunidad no tiene una descripción adicional.'}
            </p>
          </header>

          <div className="flex flex-wrap items-center gap-4 border-t pt-6">
            <RequestCommunityMembershipAction
              communityId={community.id}
              communityName={community.name}
            />
            <Button asChild variant="outline">
              <Link
                to={`${appRoutes.events}?community_id=${community.id}`}
              >
                Ver eventos de {community.name}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </article>
      </div>
    </main>
  )
}
