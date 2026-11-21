import type { ReactNode } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type AuthCardProps = {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}

/** Carte centrée des pages d'authentification. */
export function AuthCard({ title, description, children, footer, wide }: AuthCardProps) {
  return (
    <section className="mx-auto w-full px-4 py-10 sm:py-16" style={{ maxWidth: wide ? 640 : 448 }}>
      <Card>
        <CardHeader>
          <CardTitle>
            <h1 className="text-2xl font-semibold">{title}</h1>
          </CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-6">
          {children}
          {footer && (
            <div className="space-y-2 text-center text-sm text-muted-foreground">{footer}</div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
