import { Link, Outlet } from 'react-router'

import { ThemeToggle } from '@/shared/ui/theme-toggle'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/80 bg-background/95">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            className="font-heading text-lg font-semibold tracking-[-0.02em] text-foreground"
            to="/"
          >
            PoliLink
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-73px)] items-start justify-center px-4 py-12 sm:items-center sm:px-6 sm:py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              ESPOL · Comunidades estudiantiles
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
              Cerca de lo que importa.
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              Gestiona tu acceso para descubrir y compartir actividades de tu
              comunidad.
            </p>
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
