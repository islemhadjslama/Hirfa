import { MailCheckIcon } from 'lucide-react'
import type { ReactNode } from 'react'

/** Message « vérifiez votre boîte mail ». */
export function EmailSentNotice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center" role="status">
      <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-olive">
        <MailCheckIcon className="size-6" aria-hidden="true" />
      </span>
      <p className="font-heading text-lg font-semibold">{title}</p>
      <div className="text-sm text-muted-foreground">{children}</div>
    </div>
  )
}
