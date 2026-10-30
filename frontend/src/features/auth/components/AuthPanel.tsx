import type { ReactNode } from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/shared/ui/card'

type AuthPanelProps = {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
}

export function AuthPanel({
  children,
  description,
  footer,
  title,
}: AuthPanelProps) {
  return (
    <Card className="border-border/80 bg-card/90">
      <CardHeader className="gap-2 pb-2">
        <CardTitle className="text-xl tracking-[-0.03em]">{title}</CardTitle>
        <CardDescription className="text-base leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      <CardFooter className="justify-center border-border/80 bg-muted/30 text-sm text-muted-foreground">
        {footer}
      </CardFooter>
    </Card>
  )
}
