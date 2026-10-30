import { ArrowLeft } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'

import { appRoutes } from '@/app/routes'
import { SmartSearch } from '@/features/discovery/components/SmartSearch'
import { normalizeDiscoveryQuery } from '@/features/discovery/model/discovery-query'

export function DiscoveryPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = normalizeDiscoveryQuery(searchParams.get('q') ?? '')

  return (
    <main className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <header className="space-y-6">
          <Link
            className="inline-flex items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            to={appRoutes.home}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Volver al inicio
          </Link>
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              ESPOL · Búsqueda en lenguaje natural
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Descubre con IA
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              Cuéntanos qué te interesa y te mostraremos eventos y comunidades
              publicados en PoliLink que coinciden contigo.
            </p>
          </div>
        </header>

        <SmartSearch
          onQueryChange={(nextQuery) => setSearchParams({ q: nextQuery })}
          query={query}
          scope="all"
        />
      </div>
    </main>
  )
}
