import type { ReactNode } from 'react'

type PageHeaderProps = {
  title: string
  description?: ReactNode
  actions?: ReactNode
}

/** En-tête des pages des espaces artisan et admin. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
