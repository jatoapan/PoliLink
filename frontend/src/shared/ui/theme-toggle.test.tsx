import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useTheme } from 'next-themes'

import { ThemeToggle } from '@/shared/ui/theme-toggle'

vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}))

const mockedUseTheme = vi.mocked(useTheme)

describe('ThemeToggle', () => {
  const setTheme = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('cycles from light to dark to system', () => {
    mockedUseTheme.mockReturnValue({
      setTheme,
      theme: 'light',
      themes: ['light', 'dark', 'system'],
    })

    const { rerender } = render(<ThemeToggle />)

    expect(
      screen.getByRole('button', { name: 'Tema claro. Clic para cambiar.' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button'))
    expect(setTheme).toHaveBeenLastCalledWith('dark')

    mockedUseTheme.mockReturnValue({
      setTheme,
      theme: 'dark',
      themes: ['light', 'dark', 'system'],
    })
    rerender(<ThemeToggle />)

    fireEvent.click(screen.getByRole('button'))
    expect(setTheme).toHaveBeenLastCalledWith('system')
  })

  it('uses the device theme when the provider reports system', () => {
    mockedUseTheme.mockReturnValue({
      resolvedTheme: 'dark',
      setTheme,
      systemTheme: 'dark',
      theme: 'system',
      themes: ['light', 'dark', 'system'],
    })

    render(<ThemeToggle />)

    expect(
      screen.getByRole('button', {
        name: 'Tema del dispositivo. Clic para cambiar.',
      }),
    ).toBeInTheDocument()
  })
})
