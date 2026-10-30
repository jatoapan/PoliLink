type DiscoveryReasonsProps = {
  reasons: string[]
  label: string
}

export function DiscoveryReasons({ reasons, label }: DiscoveryReasonsProps) {
  if (reasons.length === 0) return null

  return (
    <div className="space-y-2 px-1 text-sm">
      <p className="font-medium">Por qué aparece</p>
      <ul
        aria-label={label}
        className="list-disc space-y-1 pl-5 text-muted-foreground"
      >
        {reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </div>
  )
}
