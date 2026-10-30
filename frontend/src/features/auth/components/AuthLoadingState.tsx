import { LoaderCircle } from 'lucide-react'

export function AuthLoadingState() {
  return (
    <div
      aria-live="polite"
      className="flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-card/70 p-6 text-sm text-muted-foreground"
      role="status"
    >
      <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      Verificando tu sesión…
    </div>
  )
}
