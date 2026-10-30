import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <main className="flex min-h-[calc(100vh-73px)] items-center justify-center px-4 py-16 sm:px-6">
      <section className="w-full max-w-xl space-y-5 rounded-xl border border-border bg-card p-8 sm:p-12">
        <p className="text-sm font-medium text-muted-foreground">PoliLink</p>
        <h1 className="font-heading text-4xl leading-tight font-semibold tracking-[-0.04em]">
          Página no encontrada
        </h1>
        <p className="text-lg leading-relaxed text-muted-foreground">
          La ruta solicitada todavía no existe.
        </p>
        <Link
          className="inline-flex text-sm font-medium text-foreground underline underline-offset-4 transition-colors hover:text-muted-foreground"
          to="/"
        >
          Volver al inicio
        </Link>
      </section>
    </main>
  )
}
