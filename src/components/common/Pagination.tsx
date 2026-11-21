import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Link, useLocation, useSearchParams } from 'react-router'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type PaginationProps = {
  page: number
  pageCount: number
}

/** Pages affichées : 1 … 4 5 6 … 10 */
function pageList(page: number, pageCount: number): (number | 'gap')[] {
  const pages = new Set([1, pageCount, page - 1, page, page + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b)
  const result: (number | 'gap')[] = []
  for (const [index, value] of sorted.entries()) {
    if (index > 0 && value - sorted[index - 1] > 1) result.push('gap')
    result.push(value)
  }
  return result
}

/** Pagination par liens : conserve les autres paramètres de l'URL (`?page=`). */
export function Pagination({ page, pageCount }: PaginationProps) {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  if (pageCount <= 1) return null

  const hrefFor = (target: number) => {
    const params = new URLSearchParams(searchParams)
    if (target === 1) params.delete('page')
    else params.set('page', String(target))
    const query = params.toString()
    return `${location.pathname}${query ? `?${query}` : ''}`
  }

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1">
      <Button variant="outline" size="icon" asChild={page > 1} disabled={page <= 1}>
        {page > 1 ? (
          <Link to={hrefFor(page - 1)} aria-label="Page précédente">
            <ChevronLeftIcon />
          </Link>
        ) : (
          <span aria-label="Page précédente">
            <ChevronLeftIcon />
          </span>
        )}
      </Button>
      {pageList(page, pageCount).map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} className="px-1 text-muted-foreground" aria-hidden="true">
            …
          </span>
        ) : (
          <Button
            key={item}
            variant={item === page ? 'default' : 'ghost'}
            size="icon"
            asChild
            className={cn(item !== page && 'hidden sm:inline-flex')}
          >
            <Link
              to={hrefFor(item)}
              aria-label={`Page ${item}`}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </Link>
          </Button>
        ),
      )}
      <span className="px-2 text-sm text-muted-foreground sm:hidden">
        {page} / {pageCount}
      </span>
      <Button variant="outline" size="icon" asChild={page < pageCount} disabled={page >= pageCount}>
        {page < pageCount ? (
          <Link to={hrefFor(page + 1)} aria-label="Page suivante">
            <ChevronRightIcon />
          </Link>
        ) : (
          <span aria-label="Page suivante">
            <ChevronRightIcon />
          </span>
        )}
      </Button>
    </nav>
  )
}
