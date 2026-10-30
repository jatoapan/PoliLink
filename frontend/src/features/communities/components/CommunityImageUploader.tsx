import type { FieldError, UseFormSetValue } from 'react-hook-form'

import type { CommunityCreatePayload } from '@/features/communities/model/community.schemas'
import { ImageUploader } from '@/shared/ui/image-uploader'

type CommunityImageUploaderProps = {
  error: FieldError | undefined
  inputId: string
  selectedImage: CommunityCreatePayload['image']
  setValue: UseFormSetValue<CommunityCreatePayload>
}

export function CommunityImageUploader({
  error,
  inputId,
  selectedImage,
  setValue,
}: CommunityImageUploaderProps) {
  return (
    <ImageUploader
      ariaLabel="Imagen de la comunidad"
      error={Boolean(error)}
      errorId="community-image-error"
      inputId={inputId}
      onClear={() =>
        setValue('image', null, { shouldDirty: true, shouldValidate: true })
      }
      onSelect={(file) =>
        setValue('image', file, { shouldDirty: true, shouldValidate: true })
      }
      selectedImage={selectedImage}
    />
  )
}
