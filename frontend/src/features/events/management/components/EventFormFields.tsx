import type {
  Control,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
} from 'react-hook-form'
import { Controller } from 'react-hook-form'

import { EventImage } from '@/features/events/components/EventImage'
import {
  EventImageEditor,
  type EventImageEditorProps,
} from '@/features/events/management/components/EventImageEditor'
import type {
  EventFormReferenceData,
  EventFormValues,
} from '@/features/events/management/model/event-form.schemas'
import { DatePicker } from '@/shared/ui/date-picker'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/shared/ui/field'
import { ImageUploader } from '@/shared/ui/image-uploader'
import { Input } from '@/shared/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Textarea } from '@/shared/ui/textarea'
import { TimePicker } from '@/shared/ui/time-picker'

type EventFormFieldsProps = EventFormReferenceData & {
  control: Control<EventFormValues>
  disabled?: boolean
  errors: FieldErrors<EventFormValues>
  imageEditor?: EventImageEditorProps | undefined
  existingImageUrl?: string | null | undefined
  imageSelectionEnabled?: boolean
  register: UseFormRegister<EventFormValues>
  selectedImage: EventFormValues['image']
  selectedDate: EventFormValues['starts_on']
  setValue: UseFormSetValue<EventFormValues>
  step: 1 | 2
}

function ReferenceSelect({
  control,
  error,
  id,
  label,
  name,
  options,
  placeholder,
  disabled,
}: {
  control: Control<EventFormValues>
  disabled?: boolean
  error: FieldErrors<EventFormValues>[keyof EventFormValues]
  id: string
  label: string
  name:
    | 'community_id'
    | 'event_category_id'
    | 'event_modality_id'
    | 'location_id'
  options: Array<{ id: number; name: string }>
  placeholder: string
}) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            disabled={disabled || options.length === 0}
            onValueChange={field.onChange}
            value={field.value}
          >
            <SelectTrigger
              aria-describedby={error ? `${id}-error` : undefined}
              aria-invalid={Boolean(error)}
              id={id}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.id} value={String(option.id)}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      <FieldError id={`${id}-error`} errors={[error]} />
    </Field>
  )
}

export function EventFormFields({
  categories,
  communities,
  control,
  disabled = false,
  errors,
  imageEditor,
  existingImageUrl = null,
  imageSelectionEnabled = true,
  locations,
  modalities,
  register,
  selectedImage,
  selectedDate,
  setValue,
  step,
}: EventFormFieldsProps) {
  if (step === 1) {
    return (
      <FieldGroup>
        <Field data-invalid={Boolean(errors.title)}>
          <FieldLabel htmlFor="event-title">Título del evento</FieldLabel>
          <Input
            aria-describedby={errors.title ? 'event-title-error' : undefined}
            aria-invalid={Boolean(errors.title)}
            disabled={disabled}
            id="event-title"
            maxLength={255}
            placeholder="Ej. Taller de introducción a Laravel"
            {...register('title')}
          />
          <FieldError id="event-title-error" errors={[errors.title]} />
        </Field>

        <Field data-invalid={Boolean(errors.description)}>
          <FieldLabel htmlFor="event-description">
            Descripción del evento
          </FieldLabel>
          <Textarea
            aria-describedby={
              errors.description ? 'event-description-error' : undefined
            }
            aria-invalid={Boolean(errors.description)}
            disabled={disabled}
            id="event-description"
            placeholder="Cuéntales a los estudiantes qué aprenderán o encontrarán."
            rows={5}
            {...register('description')}
          />
          <FieldError
            id="event-description-error"
            errors={[errors.description]}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <ReferenceSelect
            control={control}
            disabled={disabled}
            error={errors.event_category_id}
            id="event-category"
            label="Categoría"
            name="event_category_id"
            options={categories}
            placeholder="Selecciona una categoría"
          />
          <ReferenceSelect
            control={control}
            disabled={disabled}
            error={errors.community_id}
            id="event-community"
            label="Comunidad organizadora"
            name="community_id"
            options={communities}
            placeholder="Selecciona una comunidad"
          />
        </div>
      </FieldGroup>
    )
  }

  return (
    <FieldGroup>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field data-invalid={Boolean(errors.starts_on)}>
          <FieldLabel htmlFor="event-starts-on">Fecha</FieldLabel>
          <Controller
            control={control}
            name="starts_on"
            render={({ field }) => (
              <DatePicker
                aria-describedby={
                  errors.starts_on ? 'event-starts-on-error' : undefined
                }
                aria-invalid={Boolean(errors.starts_on)}
                disabled={disabled}
                id="event-starts-on"
                onChange={field.onChange}
                value={field.value}
              />
            )}
          />
          <FieldError id="event-starts-on-error" errors={[errors.starts_on]} />
        </Field>
        <Field data-invalid={Boolean(errors.starts_time)}>
          <FieldLabel htmlFor="event-starts-time">Hora (ESPOL)</FieldLabel>
          <Controller
            control={control}
            name="starts_time"
            render={({ field }) => (
              <TimePicker
                aria-describedby={
                  errors.starts_time ? 'event-starts-time-error' : undefined
                }
                aria-invalid={Boolean(errors.starts_time)}
                disabled={disabled}
                id="event-starts-time"
                minTime={getMinimumTime(selectedDate)}
                onChange={field.onChange}
                value={field.value}
              />
            )}
          />
          <FieldError
            id="event-starts-time-error"
            errors={[errors.starts_time]}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <ReferenceSelect
          control={control}
          disabled={disabled}
          error={errors.event_modality_id}
          id="event-modality"
          label="Modalidad"
          name="event_modality_id"
          options={modalities}
          placeholder="Selecciona una modalidad"
        />
        <ReferenceSelect
          control={control}
          disabled={disabled}
          error={errors.location_id}
          id="event-location"
          label="Ubicación"
          name="location_id"
          options={locations}
          placeholder="Selecciona una ubicación"
        />
      </div>

      <Field data-invalid={Boolean(errors.capacity)}>
        <FieldLabel htmlFor="event-capacity">Cupos disponibles</FieldLabel>
        <Input
          aria-describedby={
            errors.capacity ? 'event-capacity-error' : undefined
          }
          aria-invalid={Boolean(errors.capacity)}
          disabled={disabled}
          id="event-capacity"
          inputMode="numeric"
          min={1}
          placeholder="Ej. 30"
          type="number"
          {...register('capacity')}
        />
        <FieldError id="event-capacity-error" errors={[errors.capacity]} />
      </Field>

      <Field data-invalid={Boolean(errors.image)}>
        <FieldLabel htmlFor="event-image">
          Imagen del evento{' '}
          <span className="font-normal text-muted-foreground">(opcional)</span>
        </FieldLabel>
        {imageSelectionEnabled ? (
          <ImageUploader
            ariaLabel="Imagen del evento"
            disabled={disabled}
            error={Boolean(errors.image)}
            errorId="event-image-error"
            inputId="event-image"
            onClear={() =>
              setValue('image', null, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            onSelect={(file) =>
              setValue('image', file, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            selectedImage={selectedImage}
          />
        ) : imageEditor ? (
          <EventImageEditor {...imageEditor} disabled={disabled} />
        ) : (
          <EventImage
            alt="Portada actual del evento"
            className="rounded-lg"
            imageUrl={existingImageUrl}
          />
        )}
        <FieldError id="event-image-error" errors={[errors.image]} />
      </Field>
    </FieldGroup>
  )
}

function getDateInputValue(date: Date) {
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part, index) =>
      index === 0 ? String(part) : String(part).padStart(2, '0'),
    )
    .join('-')
}

function getMinimumTime(selectedDate: string) {
  const now = new Date()

  if (selectedDate !== getDateInputValue(now)) return undefined

  const nextQuarter = new Date(now)
  nextQuarter.setSeconds(0, 0)
  nextQuarter.setMinutes(Math.floor(nextQuarter.getMinutes() / 15) * 15 + 15)

  if (getDateInputValue(nextQuarter) !== selectedDate) return '24:00'

  return `${String(nextQuarter.getHours()).padStart(2, '0')}:${String(nextQuarter.getMinutes()).padStart(2, '0')}`
}
