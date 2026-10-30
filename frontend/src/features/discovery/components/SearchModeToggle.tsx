import { ListFilter, Sparkles } from 'lucide-react'

import type { SearchMode } from '@/features/discovery/model/search-mode'
import { Button } from '@/shared/ui/button'

type SearchModeToggleProps = {
  mode: SearchMode
  onModeChange: (mode: SearchMode) => void
  /** Label of the page's own search, such as "Búsqueda por nombre". */
  classicLabel?: string
}

export function SearchModeToggle({
  mode,
  onModeChange,
  classicLabel = 'Búsqueda con filtros',
}: SearchModeToggleProps) {
  return (
    <fieldset className="inline-flex flex-wrap gap-2">
      <legend className="sr-only">Tipo de búsqueda</legend>
      <Button
        aria-pressed={mode === 'classic'}
        onClick={() => mode !== 'classic' && onModeChange('classic')}
        size="sm"
        variant={mode === 'classic' ? 'default' : 'outline'}
      >
        <ListFilter aria-hidden="true" />
        {classicLabel}
      </Button>
      <Button
        aria-pressed={mode === 'smart'}
        onClick={() => mode !== 'smart' && onModeChange('smart')}
        size="sm"
        variant={mode === 'smart' ? 'default' : 'outline'}
      >
        <Sparkles aria-hidden="true" />
        Búsqueda inteligente
      </Button>
    </fieldset>
  )
}
