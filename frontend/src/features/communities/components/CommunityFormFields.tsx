import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from 'react-hook-form'

import { CommunityImageUploader } from '@/features/communities/components/CommunityImageUploader'
import type { CommunityCreatePayload } from '@/features/communities/model/community.schemas'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { Input } from '@/shared/ui/input'
import { Textarea } from '@/shared/ui/textarea'

type CommunityFormFieldsProps = {
  errors: FieldErrors<CommunityCreatePayload>
  register: UseFormRegister<CommunityCreatePayload>
  selectedImage: CommunityCreatePayload['image']
  setValue: UseFormSetValue<CommunityCreatePayload>
}

export function CommunityFormFields({
  errors,
  register,
  selectedImage,
  setValue,
}: CommunityFormFieldsProps) {
  return (
    <FieldGroup>
      <Field data-invalid={Boolean(errors.name)}>
        <FieldLabel htmlFor="community-name">Nombre de la comunidad</FieldLabel>
        <Input
          aria-describedby={errors.name ? 'community-name-error' : undefined}
          aria-invalid={Boolean(errors.name)}
          id="community-name"
          maxLength={255}
          placeholder="Ej. Club de Robótica"
          {...register('name')}
        />
        <FieldError id="community-name-error" errors={[errors.name]} />
      </Field>

      <Field data-invalid={Boolean(errors.description)}>
        <FieldLabel htmlFor="community-description">
          Descripción{' '}
          <span className="font-normal text-muted-foreground">(opcional)</span>
        </FieldLabel>
        <Textarea
          aria-describedby={
            errors.description ? 'community-description-error' : undefined
          }
          aria-invalid={Boolean(errors.description)}
          id="community-description"
          placeholder="Cuéntales a los estudiantes sobre tu comunidad."
          {...register('description')}
        />
        <FieldError
          id="community-description-error"
          errors={[errors.description]}
        />
      </Field>

      <Field data-invalid={Boolean(errors.image)}>
        <FieldLabel htmlFor="community-image">
          Imagen de la comunidad{' '}
          <span className="font-normal text-muted-foreground">(opcional)</span>
        </FieldLabel>
        <CommunityImageUploader
          error={errors.image}
          inputId="community-image"
          selectedImage={selectedImage}
          setValue={setValue}
        />
        <FieldError id="community-image-error" errors={[errors.image]} />
      </Field>
    </FieldGroup>
  )
}
