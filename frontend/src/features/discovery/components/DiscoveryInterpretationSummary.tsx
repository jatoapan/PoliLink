import { Sparkles } from 'lucide-react'
import type { DiscoveryResult } from '@/features/discovery/model/discovery.schemas'
import {
  discoveryIntentLabels,
  getFallbackNotice,
} from '@/features/discovery/model/discovery-labels'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { Badge } from '@/shared/ui/badge'

type DiscoveryInterpretationSummaryProps = {
  result: DiscoveryResult
}

export function DiscoveryInterpretationSummary({
  result,
}: DiscoveryInterpretationSummaryProps) {
  const { interpretation } = result
  const keywordFilters = interpretation.keywords.map((keyword) => ({
    key: `keyword-${keyword}`,
    label: keyword,
    kind: 'Tema',
  }))
  // Communities are matched by topic only, so event filters are not shown
  // when the search is limited to communities.
  const eventFilters =
    result.scope === 'communities'
      ? []
      : [
          ...interpretation.categories.map((category) => ({
            key: `category-${category.code}`,
            label: category.name,
            kind: 'Categoría',
          })),
          ...interpretation.modalities.map((modality) => ({
            key: `modality-${modality.code}`,
            label: modality.name,
            kind: 'Modalidad',
          })),
          ...interpretation.weekdays.map((weekday) => ({
            key: `weekday-${weekday.iso}`,
            label: weekday.name,
            kind: 'Día',
          })),
        ]
  const filters = [...keywordFilters, ...eventFilters]
  const emptyFiltersMessage =
    result.scope === 'communities'
      ? 'No identificamos temas concretos, así que mostramos las comunidades más activas.'
      : 'No identificamos temas, días ni modalidades concretos, así que mostramos los próximos eventos publicados.'

  return (
    <section aria-labelledby="discovery-interpretation" className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <h2
          className="font-heading text-lg font-medium"
          id="discovery-interpretation"
        >
          Lo que entendimos
        </h2>
        {result.mode === 'ai' && (
          <Badge variant="secondary">
            <Sparkles aria-hidden="true" />
            Interpretado con Gemma
          </Badge>
        )}
      </div>

      {result.mode === 'fallback' && (
        <Alert>
          <AlertTitle>Búsqueda por palabras clave</AlertTitle>
          <AlertDescription>{getFallbackNotice(result)}</AlertDescription>
        </Alert>
      )}

      <ul aria-label="Filtros aplicados" className="flex flex-wrap gap-2">
        {result.scope === 'all' && (
          <li>
            <Badge variant="outline">
              Buscas: {discoveryIntentLabels[interpretation.intent]}
            </Badge>
          </li>
        )}
        {filters.map((filter) => (
          <li key={filter.key}>
            <Badge variant="outline">
              <span className="text-muted-foreground">{filter.kind}:</span>
              {filter.label}
            </Badge>
          </li>
        ))}
      </ul>
      {filters.length === 0 && (
        <p className="text-sm text-muted-foreground">{emptyFiltersMessage}</p>
      )}
    </section>
  )
}
