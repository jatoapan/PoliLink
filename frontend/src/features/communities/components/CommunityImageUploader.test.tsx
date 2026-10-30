import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'

import { CommunityImageUploader } from '@/features/communities/components/CommunityImageUploader'
import type { CommunityCreatePayload } from '@/features/communities/model/community.schemas'

function UploaderHarness() {
  const form = useForm<CommunityCreatePayload>({
    defaultValues: { image: null },
  })
  const selectedImage = form.watch('image')

  return (
    <CommunityImageUploader
      error={undefined}
      inputId="community-image"
      selectedImage={selectedImage}
      setValue={form.setValue}
    />
  )
}

describe('community image uploader', () => {
  it('selects an image and shows a square preview with file details', async () => {
    const user = userEvent.setup()
    const image = new File(['logo'], 'club-logo.webp', { type: 'image/webp' })
    render(<UploaderHarness />)

    await user.upload(screen.getByLabelText('Imagen de la comunidad'), image)

    expect(
      screen.getByAltText('Vista previa de club-logo.webp'),
    ).toBeInTheDocument()
    expect(screen.getByText('club-logo.webp')).toBeInTheDocument()
    expect(screen.getByText('4 B')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Cambiar imagen' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Quitar imagen' }),
    ).toBeInTheDocument()
  })

  it('supports drag and drop and exposes the active state', () => {
    const image = new File(['logo'], 'club-logo.png', { type: 'image/png' })
    render(<UploaderHarness />)

    const dropzone = screen.getByRole('button', {
      name: 'Subir imagen de la comunidad',
    })
    fireEvent.dragEnter(dropzone)

    expect(screen.getByText('Suelta la imagen aquí')).toBeInTheDocument()

    fireEvent.drop(dropzone, { dataTransfer: { files: [image] } })

    expect(
      screen.getByAltText('Vista previa de club-logo.png'),
    ).toBeInTheDocument()
  })

  it('opens the file picker with keyboard activation', async () => {
    const user = userEvent.setup()
    render(<UploaderHarness />)

    const input = screen.getByLabelText('Imagen de la comunidad')
    const clickSpy = vi.spyOn(input, 'click')
    const dropzone = screen.getByRole('button', {
      name: 'Subir imagen de la comunidad',
    })

    dropzone.focus()
    await user.keyboard('{Enter}')

    expect(clickSpy).toHaveBeenCalledOnce()
  })

  it('removes the selected image and resets the input', async () => {
    const user = userEvent.setup()
    const image = new File(['logo'], 'club-logo.jpg', { type: 'image/jpeg' })
    render(<UploaderHarness />)

    const input = screen.getByLabelText('Imagen de la comunidad')
    await user.upload(input, image)
    await user.click(screen.getByRole('button', { name: 'Quitar imagen' }))

    expect(
      screen.queryByAltText('Vista previa de club-logo.jpg'),
    ).not.toBeInTheDocument()
    expect(input).toHaveValue('')
  })
})
