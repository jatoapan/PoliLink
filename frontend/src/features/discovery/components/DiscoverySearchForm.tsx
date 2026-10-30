import { Search } from 'lucide-react'
import { type FormEvent, useId, useState } from 'react'

import {
  DISCOVERY_QUERY_MAX_LENGTH,
  getDiscoveryQueryError,
  normalizeDiscoveryQuery,
} from '@/features/discovery/model/discovery-query'
import { Button } from '@/shared/ui/button'
import { Label } from '@/shared/ui/label'
import { Textarea } from '@/shared/ui/textarea'

type DiscoverySearchFormProps = {
  /** The query currently shown in the results. */
  initialQuery: string
  /** Whether the search for `initialQuery` is in flight. */
  isSearching: boolean
  serverError?: string | null
  onSearch: (query: string) => void
}

export function DiscoverySearchForm({
  initialQuery,
  isSearching,
  serverError = null,
  onSearch,
}: DiscoverySearchFormProps) {
  const inputId = useId()
  const hintId = useId()
  const errorId = useId()
  const [value, setValue] = useState(initialQuery)
  const [localError, setLocalError] = useState<string | null>(null)
  const error = localError ?? serverError
  const isSearchingThisQuery =
    isSearching && normalizeDiscoveryQuery(value) === initialQuery

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validationError = getDiscoveryQueryError(value)

    if (validationError) {
      setLocalError(validationError)
      return
    }

    setLocalError(null)
    onSearch(normalizeDiscoveryQuery(value))
  }

  return (
    <search>
      <form
        aria-label="Buscar eventos y comunidades"
        className="space-y-3 rounded-xl p-4 ring-1 ring-foreground/10 sm:p-5"
        noValidate
        onSubmit={handleSubmit}
      >
        <Label htmlFor={inputId}>¿Qué te gustaría encontrar?</Label>
        <Textarea
          aria-describedby={error ? `${hintId} ${errorId}` : hintId}
          aria-invalid={error ? true : undefined}
          className="min-h-20 resize-none text-base"
          id={inputId}
          maxLength={DISCOVERY_QUERY_MAX_LENGTH}
          name="query"
          onChange={(event) => {
            setValue(event.target.value)
            if (localError) setLocalError(null)
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }
          }}
          placeholder="Por ejemplo: talleres presenciales de robótica los viernes"
          value={value}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground" id={hintId}>
            Describe tus intereses, días o modalidad con tus propias palabras.
            Entre 3 y {DISCOVERY_QUERY_MAX_LENGTH} caracteres.
          </p>
          <Button
            className="shrink-0"
            disabled={isSearchingThisQuery}
            type="submit"
          >
            <Search aria-hidden="true" />
            {isSearchingThisQuery ? 'Buscando…' : 'Buscar'}
          </Button>
        </div>
        {error && (
          <p className="text-sm text-destructive" id={errorId} role="alert">
            {error}
          </p>
        )}
      </form>
    </search>
  )
}
