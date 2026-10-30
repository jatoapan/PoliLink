import { LoaderCircle, Plus } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'

import { ApiErrorFeedback } from '@/shared/ui/api-error-feedback'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Skeleton } from '@/shared/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'

export type CatalogResourceItem = {
  id: number
  name: string
  is_active: boolean
  code?: string
  description?: string | null
}

type CatalogRowValues = {
  name: string
  description: string
}

function toRowValues(item: CatalogResourceItem): CatalogRowValues {
  return { name: item.name, description: item.description ?? '' }
}

function CatalogResourceRow({
  item,
  hasDescription,
  onUpdateName,
  onToggleActive,
  isSaving,
  isToggling,
}: {
  item: CatalogResourceItem
  hasDescription: boolean
  onUpdateName: (id: number, values: CatalogRowValues) => Promise<void>
  onToggleActive: (id: number, nextActive: boolean) => Promise<void>
  isSaving: boolean
  isToggling: boolean
}) {
  const [values, setValues] = useState<CatalogRowValues>(toRowValues(item))

  useEffect(() => {
    setValues(toRowValues(item))
  }, [item])

  const isDirty =
    values.name.trim() !== item.name ||
    (hasDescription && values.description.trim() !== (item.description ?? ''))

  return (
    <TableRow>
      {item.code !== undefined && (
        <TableCell className="font-mono text-xs text-muted-foreground">
          {item.code}
        </TableCell>
      )}
      <TableCell>
        <Input
          aria-label={`Nombre de ${item.name}`}
          className="min-w-40"
          onChange={(event) =>
            setValues((current) => ({ ...current, name: event.target.value }))
          }
          value={values.name}
        />
      </TableCell>
      {hasDescription && (
        <TableCell>
          <Input
            aria-label={`Descripción de ${item.name}`}
            className="min-w-48"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            value={values.description}
          />
        </TableCell>
      )}
      <TableCell>
        <Badge variant={item.is_active ? 'default' : 'secondary'}>
          {item.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap justify-end gap-2">
          {isDirty && (
            <Button
              disabled={isSaving || values.name.trim().length === 0}
              onClick={() => void onUpdateName(item.id, values)}
              size="sm"
              variant="outline"
            >
              {isSaving && (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              )}
              Guardar
            </Button>
          )}
          <Button
            disabled={isToggling}
            onClick={() => void onToggleActive(item.id, !item.is_active)}
            size="sm"
            variant="ghost"
          >
            {isToggling && (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            )}
            {item.is_active ? 'Desactivar' : 'Activar'}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

function CreateResourceForm({
  hasCode,
  hasDescription,
  idPrefix,
  isCreating,
  onCreate,
}: {
  hasCode: boolean
  hasDescription: boolean
  idPrefix: string
  isCreating: boolean
  onCreate: (values: {
    code: string
    name: string
    description: string
  }) => Promise<boolean>
}) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const wasCreated = await onCreate({ code, name, description })

    if (wasCreated) {
      setCode('')
      setName('')
      setDescription('')
    }
  }

  return (
    <form
      className="flex flex-wrap items-end gap-2 rounded-lg border bg-muted/30 p-3"
      onSubmit={(event) => void handleSubmit(event)}
    >
      {hasCode && (
        <div className="flex-1 basis-32 space-y-1">
          <label
            className="text-xs font-medium text-muted-foreground"
            htmlFor={`${idPrefix}-code`}
          >
            Código
          </label>
          <Input
            id={`${idPrefix}-code`}
            onChange={(event) => setCode(event.target.value)}
            placeholder="ej. taller"
            value={code}
          />
        </div>
      )}
      <div className="flex-1 basis-48 space-y-1">
        <label
          className="text-xs font-medium text-muted-foreground"
          htmlFor={`${idPrefix}-name`}
        >
          Nombre
        </label>
        <Input
          id={`${idPrefix}-name`}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nombre visible"
          value={name}
        />
      </div>
      {hasDescription && (
        <div className="flex-[2] basis-56 space-y-1">
          <label
            className="text-xs font-medium text-muted-foreground"
            htmlFor={`${idPrefix}-description`}
          >
            Descripción
          </label>
          <Input
            id={`${idPrefix}-description`}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Opcional"
            value={description}
          />
        </div>
      )}
      <Button disabled={isCreating} type="submit">
        {isCreating ? (
          <LoaderCircle aria-hidden="true" className="animate-spin" />
        ) : (
          <Plus aria-hidden="true" />
        )}
        Agregar
      </Button>
    </form>
  )
}

export type CatalogResourceSectionProps = {
  title: string
  description: string
  hasCode: boolean
  hasDescription?: boolean
  idPrefix: string
  items: CatalogResourceItem[] | undefined
  isLoading: boolean
  isError: boolean
  error: unknown
  onRetry: () => void
  onCreate: (values: {
    code: string
    name: string
    description: string
  }) => Promise<boolean>
  isCreating: boolean
  createError: unknown
  onUpdateName: (id: number, values: CatalogRowValues) => Promise<void>
  onToggleActive: (id: number, nextActive: boolean) => Promise<void>
  savingId: number | null
  togglingId: number | null
}

export function CatalogResourceSection({
  title,
  description,
  hasCode,
  hasDescription = false,
  idPrefix,
  items,
  isLoading,
  isError,
  error,
  onRetry,
  onCreate,
  isCreating,
  createError,
  onUpdateName,
  onToggleActive,
  savingId,
  togglingId,
}: CatalogResourceSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <CreateResourceForm
          hasCode={hasCode}
          hasDescription={hasDescription}
          idPrefix={idPrefix}
          isCreating={isCreating}
          onCreate={onCreate}
        />

        {createError !== null && createError !== undefined && (
          <ApiErrorFeedback error={createError} title="No se pudo crear el registro" />
        )}

        {isLoading && (
          <div aria-label={`Cargando ${title.toLowerCase()}`} className="space-y-2" role="status">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        )}

        {isError && (
          <ApiErrorFeedback
            error={error}
            onRetry={onRetry}
            title={`No pudimos cargar ${title.toLowerCase()}`}
          />
        )}

        {!isLoading && !isError && (
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  {hasCode && <TableHead>Código</TableHead>}
                  <TableHead>Nombre</TableHead>
                  {hasDescription && <TableHead>Descripción</TableHead>}
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.length ? (
                  items.map((item) => (
                    <CatalogResourceRow
                      hasDescription={hasDescription}
                      isSaving={savingId === item.id}
                      isToggling={togglingId === item.id}
                      item={item}
                      key={item.id}
                      onToggleActive={onToggleActive}
                      onUpdateName={onUpdateName}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      className="text-center text-sm text-muted-foreground"
                      colSpan={hasCode ? (hasDescription ? 5 : 4) : hasDescription ? 4 : 3}
                    >
                      Todavía no hay registros.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
