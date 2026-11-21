import { ImagePlusIcon, Loader2Icon, Trash2Icon } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import type { SingleImageValue } from '@/features/artisan/images'
import { ACCEPTED_IMAGE_INPUT, compressImage } from '@/lib/storage'
import { cn } from '@/lib/utils'

type SingleImageFieldProps = {
  label: string
  description?: string
  value: SingleImageValue
  onChange: (value: SingleImageValue) => void
  /** Format de l'aperçu : carré (logo) ou large (bannière). */
  shape: 'square' | 'wide'
  maxWidthOrHeight?: number
  disabled?: boolean
}

/** Choix d'une image unique (logo, bannière), compressée dès la sélection. */
export function SingleImageField({
  label,
  description,
  value,
  onChange,
  shape,
  maxWidthOrHeight = 1600,
  disabled,
}: SingleImageFieldProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Libère l'URL temporaire de l'aperçu quand elle n'est plus utilisée
  const objectUrl = value?.kind === 'file' ? value.url : null
  useEffect(() => {
    if (!objectUrl) return
    return () => URL.revokeObjectURL(objectUrl)
  }, [objectUrl])

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      const compressed = await compressImage(file, maxWidthOrHeight)
      onChange({ kind: 'file', file: compressed, url: URL.createObjectURL(compressed) })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image invalide.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={inputId}>{label}</FieldLabel>
      <div className="flex flex-wrap items-center gap-4">
        <div
          className={cn(
            'flex items-center justify-center overflow-hidden rounded-xl border bg-muted',
            shape === 'square' ? 'size-24' : 'aspect-[3/1] w-full max-w-md',
          )}
        >
          {busy ? (
            <Loader2Icon className="size-6 animate-spin text-primary" aria-label="Compression…" />
          ) : value ? (
            <img src={value.url} alt={`Aperçu : ${label}`} className="size-full object-cover" />
          ) : (
            <ImagePlusIcon className="size-6 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || busy}
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlusIcon />
            {value ? 'Changer' : 'Choisir une image'}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || busy}
              onClick={() => onChange(null)}
            >
              <Trash2Icon />
              Retirer
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED_IMAGE_INPUT}
        className="sr-only"
        tabIndex={-1}
        onChange={(event) => void handleFile(event)}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {error && <FieldError>{error}</FieldError>}
    </Field>
  )
}
