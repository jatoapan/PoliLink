import { Filter, Search } from 'lucide-react'

import type {
  CatalogFilterChanges,
  CatalogFilters,
} from '@/features/events/catalog/model/catalog-filters'
import { countActiveCatalogFilters } from '@/features/events/catalog/model/catalog-filters'
import type {
  EventCategory,
  EventCommunity,
  EventModality,
} from '@/features/events/model/event.schemas'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet'

type EventCatalogFiltersProps = {
  filters: CatalogFilters
  searchInput: string
  categories: EventCategory[]
  modalities: EventModality[]
  communities: EventCommunity[]
  onSearchChange: (value: string) => void
  onFilterChange: (changes: CatalogFilterChanges) => void
  onReset: () => void
}

type ReferenceOption = {
  id: number
  name: string
  code?: string
}

type FilterControlsProps = {
  filters: CatalogFilters
  categories: ReferenceOption[]
  modalities: ReferenceOption[]
  communities: ReferenceOption[]
  idPrefix: string
  onFilterChange: (changes: CatalogFilterChanges) => void
}

function FilterSelect({
  id,
  label,
  options,
  placeholder,
  value,
  onChange,
}: {
  id: string
  label: string
  options: ReferenceOption[]
  placeholder: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        onValueChange={(selectedValue) =>
          onChange(selectedValue === 'all' ? '' : selectedValue)
        }
        value={value || 'all'}
      >
        <SelectTrigger className="w-full" id={id}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          {options.map((option) => (
            <SelectItem
              key={option.id}
              value={option.code ?? String(option.id)}
            >
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function FilterControls({
  filters,
  categories,
  modalities,
  communities,
  idPrefix,
  onFilterChange,
}: FilterControlsProps) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor={`${idPrefix}-date`}>Fecha</Label>
        <Input
          id={`${idPrefix}-date`}
          onChange={(event) => onFilterChange({ date: event.target.value })}
          type="date"
          value={filters.date}
        />
      </div>
      <FilterSelect
        id={`${idPrefix}-category`}
        label="Categoría"
        onChange={(value) => onFilterChange({ category: value })}
        options={categories}
        placeholder="Todas las categorías"
        value={filters.category}
      />
      <FilterSelect
        id={`${idPrefix}-modality`}
        label="Modalidad"
        onChange={(value) => onFilterChange({ modality: value })}
        options={modalities}
        placeholder="Todas las modalidades"
        value={filters.modality}
      />
      <FilterSelect
        id={`${idPrefix}-community`}
        label="Comunidad"
        onChange={(value) =>
          onFilterChange({ communityId: value ? Number(value) : null })
        }
        options={communities}
        placeholder="Todas las comunidades"
        value={filters.communityId ? String(filters.communityId) : ''}
      />
    </>
  )
}

export function EventCatalogFilters({
  filters,
  searchInput,
  categories,
  modalities,
  communities,
  onSearchChange,
  onFilterChange,
  onReset,
}: EventCatalogFiltersProps) {
  const activeFilterCount = countActiveCatalogFilters(filters)

  return (
    <section aria-label="Filtros de eventos" className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Label className="sr-only" htmlFor="catalog-search">
            Buscar eventos
          </Label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            className="h-10 pl-9"
            id="catalog-search"
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por título o descripción"
            type="search"
            value={searchInput}
          />
        </div>

        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button className="h-10 w-full sm:w-auto" variant="outline">
                <Filter />
                Filtros
                {activeFilterCount > 0 && (
                  <Badge className="ml-1" variant="secondary">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="max-h-[85vh] overflow-y-auto" side="bottom">
              <SheetHeader>
                <SheetTitle>Filtra los eventos</SheetTitle>
                <SheetDescription>
                  Ajusta los criterios para encontrar una actividad de tu
                  interés.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 px-4 pb-4">
                <FilterControls
                  categories={categories}
                  communities={communities}
                  filters={filters}
                  idPrefix="mobile-catalog"
                  modalities={modalities}
                  onFilterChange={onFilterChange}
                />
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button onClick={onReset} variant="ghost">
                    Limpiar filtros
                  </Button>
                </SheetClose>
                <SheetClose asChild>
                  <Button>Ver resultados</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="hidden gap-3 lg:grid lg:grid-cols-4">
        <FilterControls
          categories={categories}
          communities={communities}
          filters={filters}
          idPrefix="desktop-catalog"
          modalities={modalities}
          onFilterChange={onFilterChange}
        />
      </div>

      {activeFilterCount > 0 && (
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            {activeFilterCount === 1
              ? '1 filtro activo'
              : `${activeFilterCount} filtros activos`}
          </span>
          <Button onClick={onReset} size="sm" variant="ghost">
            Limpiar filtros
          </Button>
        </div>
      )}
    </section>
  )
}
