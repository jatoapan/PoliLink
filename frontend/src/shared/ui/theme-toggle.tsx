import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/shared/ui/button'

const themes = ['light', 'dark', 'system'] as const
type Theme = (typeof themes)[number]

const themeLabels: Record<Theme, string> = {
  dark: 'Tema oscuro',
  light: 'Tema claro',
  system: 'Tema del dispositivo',
}

const themeIcons: Record<Theme, typeof Sun> = {
  dark: Moon,
  light: Sun,
  system: Monitor,
}

export function ThemeToggle() {
  const { setTheme, theme = 'system' } = useTheme()
  const activeTheme: Theme = themes.includes(theme as Theme)
    ? (theme as Theme)
    : 'system'
  const activeIndex = themes.indexOf(activeTheme)
  const nextTheme = themes[(activeIndex + 1) % themes.length] ?? 'system'
  const Icon = themeIcons[activeTheme]
  const label = `${themeLabels[activeTheme]}. Clic para cambiar.`

  return (
    <Button
      aria-label={label}
      onClick={() => setTheme(nextTheme)}
      size="icon"
      title={label}
      type="button"
      variant="ghost"
    >
      <Icon aria-hidden="true" />
    </Button>
  )
}
