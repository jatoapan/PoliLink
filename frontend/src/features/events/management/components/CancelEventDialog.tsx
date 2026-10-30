import { CalendarX, LoaderCircle } from 'lucide-react'
import { useState } from 'react'

import type { Event } from '@/features/events/model/event.schemas'
import { useCancelOrganizerEvent } from '@/features/organizer/hooks/use-organizer-queries'
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
  DialogTrigger,
} from '@/shared/ui/dialog'

type CancelEventDialogProps = {
  event: Event
}

export function CancelEventDialog({ event }: CancelEventDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const cancelMutation = useCancelOrganizerEvent()

  const handleOpenChange = (nextOpen: boolean) => {
    if (cancelMutation.isPending) return

    setIsOpen(nextOpen)

    if (!nextOpen) cancelMutation.reset()
  }

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(event.id)
      cancelMutation.reset()
      setIsOpen(false)
    } catch {
      // The mutation error is rendered inside the confirmation dialog.
    }
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen}>
      <DialogTrigger asChild>
        <Button
          aria-label={`Cancelar evento ${event.title}`}
          size="sm"
          variant="destructive"
        >
          <CalendarX aria-hidden="true" />
          Cancelar evento
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Cancelar evento?</DialogTitle>
          <DialogDescription>
            “{event.title}” dejará de aparecer en el catálogo público y ya no
            podrás editarlo. El evento se conservará en tu historial como
            cancelado.
          </DialogDescription>
        </DialogHeader>

        {cancelMutation.error && (
          <ApiErrorFeedback
            error={cancelMutation.error}
            isRetrying={cancelMutation.isPending}
            messageOverrides={{
              conflict:
                'Este evento ya fue cancelado. Actualiza el historial para ver su estado.',
              forbidden: 'No tienes permisos para cancelar este evento.',
            }}
            onRetry={() => void handleCancel()}
            title="No se pudo cancelar el evento"
          />
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button disabled={cancelMutation.isPending} variant="outline">
              Volver
            </Button>
          </DialogClose>
          <Button
            disabled={cancelMutation.isPending}
            onClick={() => void handleCancel()}
            variant="destructive"
          >
            {cancelMutation.isPending && (
              <LoaderCircle aria-hidden="true" className="animate-spin" />
            )}
            {cancelMutation.isPending ? 'Cancelando…' : 'Cancelar evento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
