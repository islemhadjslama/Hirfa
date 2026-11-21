import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ImagePlusIcon,
  Loader2Icon,
  StarIcon,
  XIcon,
} from 'lucide-react'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'

import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import type { ImageItem } from '@/features/artisan/images'
import { MAX_IMAGE_SIZE_MB, MAX_PRODUCT_IMAGES } from '@/lib/constants'
import { ACCEPTED_IMAGE_INPUT, compressImage } from '@/lib/storage'

type ImageUploaderProps = {
  value: ImageItem[]
  onChange: (images: ImageItem[]) => void
  error?: string
  disabled?: boolean
}

function move<T>(list: T[], from: number, to: number): T[] {
  const copy = [...list]
  const [item] = copy.splice(from, 1)
  copy.splice(to, 0, item)
  return copy
}

/**
 * ART-4 — De 1 à 5 images, réordonnables ; la première est l'image principale.
 * Les images sont compressées dès la sélection et envoyées à l'enregistrement.
 * Réordonnancement par boutons (utilisable au clavier et sur mobile).
 */
export function ImageUploader({ value, onChange, error, disabled }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [fileErrors, setFileErrors] = useState<string[]>([])
  const remaining = MAX_PRODUCT_IMAGES - value.length

  // Libère les URL temporaires des aperçus au démontage
  const latest = useRef(value)
  useEffect(() => {
    latest.current = value
  }, [value])
  useEffect(
    () => () => {
      for (const image of latest.current) {
        if (image.kind === 'new') URL.revokeObjectURL(image.url)
      }
    },
    [],
  )

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    const errors: string[] = []
    if (files.length > remaining) {
      errors.push(`${MAX_PRODUCT_IMAGES} images maximum : seules les premières ont été ajoutées.`)
    }
    setBusy(true)
    const added: ImageItem[] = []
    for (const file of files.slice(0, remaining)) {
      try {
        const compressed = await compressImage(file)
        added.push({
          key: crypto.randomUUID(),
          kind: 'new',
          file: compressed,
          url: URL.createObjectURL(compressed),
        })
      } catch (err) {
        errors.push(err instanceof Error ? err.message : `« ${file.name} » : image invalide.`)
      }
    }
    setBusy(false)
    setFileErrors(errors)
    if (added.length > 0) onChange([...value, ...added])
  }

  function remove(index: number) {
    const image = value[index]
    if (image.kind === 'new') URL.revokeObjectURL(image.url)
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {value.map((image, index) => (
          <li key={image.key} className="overflow-hidden rounded-xl border bg-card">
            <div className="relative aspect-square bg-muted">
              <img
                src={image.url}
                alt={`Image ${index + 1}${index === 0 ? ' (principale)' : ''}`}
                className="size-full object-cover"
              />
              {index === 0 && (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                  <StarIcon className="size-3" aria-hidden="true" />
                  Principale
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-1 p-1">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled || index === 0}
                onClick={() => onChange(move(value, index, index - 1))}
                aria-label={`Déplacer l’image ${index + 1} vers la gauche`}
              >
                <ArrowLeftIcon />
              </Button>
              {index > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled}
                  onClick={() => onChange(move(value, index, 0))}
                  aria-label={`Utiliser l’image ${index + 1} comme image principale`}
                  title="Image principale"
                >
                  <StarIcon />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled || index === value.length - 1}
                onClick={() => onChange(move(value, index, index + 1))}
                aria-label={`Déplacer l’image ${index + 1} vers la droite`}
              >
                <ArrowRightIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={disabled}
                onClick={() => remove(index)}
                aria-label={`Retirer l’image ${index + 1}`}
                className="text-destructive"
              >
                <XIcon />
              </Button>
            </div>
          </li>
        ))}

        {remaining > 0 && (
          <li>
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => inputRef.current?.click()}
              className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed bg-card p-3 text-center text-sm text-muted-foreground transition hover:border-primary/50 hover:text-primary disabled:opacity-50"
            >
              {busy ? (
                <Loader2Icon className="size-6 animate-spin" aria-hidden="true" />
              ) : (
                <ImagePlusIcon className="size-6" aria-hidden="true" />
              )}
              {busy ? 'Compression…' : 'Ajouter des images'}
            </button>
          </li>
        )}
      </ul>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_IMAGE_INPUT}
        className="sr-only"
        tabIndex={-1}
        aria-label="Ajouter des images"
        onChange={(event) => void handleFiles(event)}
      />

      <p className="text-sm text-muted-foreground">
        {value.length}/{MAX_PRODUCT_IMAGES} images · JPG, PNG ou WebP · {MAX_IMAGE_SIZE_MB} Mo
        maximum après compression. La première image est l’image principale.
      </p>
      {fileErrors.map((message) => (
        <FieldError key={message}>{message}</FieldError>
      ))}
      {error && <FieldError>{error}</FieldError>}
    </div>
  )
}
