import { ImageIcon } from 'lucide-react'
import { useState } from 'react'

import { cn } from '@/shared/utils/cn'

type EventImageProps = {
  alt: string
  className?: string
  imageUrl: string | null
}

export function EventImage({ alt, className, imageUrl }: EventImageProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null)
  const canRenderImage = Boolean(imageUrl) && failedImageUrl !== imageUrl

  return (
    <div
      className={cn(
        'flex aspect-video w-full items-center justify-center overflow-hidden bg-muted',
        className,
      )}
      data-slot="event-image"
    >
      {canRenderImage ? (
        <img
          alt={alt}
          className="size-full object-cover"
          onError={() => setFailedImageUrl(imageUrl)}
          src={imageUrl ?? undefined}
        />
      ) : (
        <ImageIcon
          aria-hidden="true"
          className="size-9 text-muted-foreground/60"
          data-slot="event-image-fallback"
        />
      )}
    </div>
  )
}
