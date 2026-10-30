import { LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { eventImageFileSchema } from '@/features/events/management/model/event-form.schemas'
import type { Event } from '@/features/events/model/event.schemas'
import { ApiErrorFeedback } from '@/shared/ui/api-error-feedback'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { ImageUploader } from '@/shared/ui/image-uploader'

export type EventImageEditorProps = {
  disabled?: boolean
  imageUrl?: string | null | undefined
  isPending: boolean
  onRemove: () => Promise<Event>
  onResetRemove: () => void
  onResetUpload: () => void
  onUpload: (image: File) => Promise<Event>
  removeError: unknown
  uploadError: unknown
}

export function EventImageEditor({
  disabled = false,
  imageUrl = null,
  isPending,
  onRemove,
  onResetRemove,
  onResetUpload,
  onUpload,
  removeError,
  uploadError,
}: EventImageEditorProps) {
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<
    'remove' | 'upload' | null
  >(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)

  useEffect(() => {
    if (!isPending) setPendingAction(null)
  }, [isPending])

  const uploadSelectedImage = async (image: File) => {
    try {
      await onUpload(image)
      setSelectedImage(null)
    } catch {
      // The mutation error is rendered below the uploader.
    }
  }

  const handleSelect = (file: File | undefined) => {
    if (!file || disabled || isPending) return

    const result = eventImageFileSchema.safeParse(file)

    if (!result.success) {
      setLocalError(
        result.error.issues[0]?.message ?? 'Selecciona una imagen válida.',
      )
      return
    }

    onResetUpload()
    setLocalError(null)
    setPendingAction('upload')
    setSelectedImage(file)
    void uploadSelectedImage(file)
  }

  const handleClearSelected = () => {
    if (disabled || isPending) return

    onResetUpload()
    setLocalError(null)
    setSelectedImage(null)
  }

  const handleRemoveDialogChange = (nextOpen: boolean) => {
    if (isPending) return

    setIsRemoveDialogOpen(nextOpen)

    if (!nextOpen) onResetRemove()
  }

  const handleRemove = async () => {
    try {
      setPendingAction('remove')
      await onRemove()
      setIsRemoveDialogOpen(false)
    } catch {
      // The mutation error is rendered inside the confirmation dialog.
    }
  }

  return (
    <div className="space-y-3">
      <ImageUploader
        ariaLabel="Imagen del evento"
        disabled={disabled || isPending}
        error={Boolean(localError || uploadError)}
        errorId={localError ? 'event-image-editor-error' : undefined}
        existingImageAlt="Portada actual del evento"
        existingImageUrl={imageUrl}
        inputId="event-image-edit"
        onClear={handleClearSelected}
        onRemoveExisting={() => {
          onResetRemove()
          setIsRemoveDialogOpen(true)
        }}
        onSelect={handleSelect}
        selectedImage={selectedImage}
      />

      {localError && (
        <p
          className="text-sm text-destructive"
          id="event-image-editor-error"
          role="alert"
        >
          {localError}
        </p>
      )}

      {isPending && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          {pendingAction === 'remove'
            ? 'Eliminando imagen…'
            : 'Subiendo imagen…'}
        </p>
      )}

      {Boolean(uploadError) && (
        <ApiErrorFeedback
          error={uploadError}
          isRetrying={isPending && pendingAction === 'upload'}
          messageOverrides={{
            conflict: 'Este evento ya no permite modificar su imagen.',
            forbidden: 'No tienes permisos para modificar esta imagen.',
            validation: 'La imagen no cumple con el formato permitido.',
          }}
          onRetry={
            selectedImage
              ? () => {
                  onResetUpload()
                  setPendingAction('upload')
                  void uploadSelectedImage(selectedImage)
                }
              : undefined
          }
          title="No se pudo actualizar la imagen"
        />
      )}

      <Dialog onOpenChange={handleRemoveDialogChange} open={isRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar imagen?</DialogTitle>
            <DialogDescription>
              La imagen dejará de mostrarse en este evento. Puedes subir otra
              después desde este mismo formulario.
            </DialogDescription>
          </DialogHeader>

          {Boolean(removeError) && (
            <ApiErrorFeedback
              error={removeError}
              isRetrying={isPending && pendingAction === 'remove'}
              messageOverrides={{
                conflict: 'Este evento ya no permite modificar su imagen.',
                forbidden: 'No tienes permisos para eliminar esta imagen.',
              }}
              onRetry={() => void handleRemove()}
              title="No se pudo eliminar la imagen"
            />
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button disabled={isPending} variant="outline">
                Volver
              </Button>
            </DialogClose>
            <Button
              disabled={isPending}
              onClick={() => void handleRemove()}
              variant="destructive"
            >
              {isPending && pendingAction === 'remove' && (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              )}
              {isPending && pendingAction === 'remove'
                ? 'Eliminando…'
                : 'Eliminar imagen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
