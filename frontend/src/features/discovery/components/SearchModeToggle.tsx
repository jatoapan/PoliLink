import { ListFilter, Sparkles } from 'lucide-react'

import type { SearchMode } from '@/features/discovery/model/search-mode'
import { Button } from '@/shared/ui/button'

type SearchModeToggleProps = {
  mode: SearchMode
  onModeChange: (mode: SearchMode) => void
}

export function SearchModeToggle({
  mode,
  onModeChange,
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
        Búsqueda con filtros
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
