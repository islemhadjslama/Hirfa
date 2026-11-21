import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon, PencilIcon, PlusIcon, TagsIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { SingleImageField } from '@/components/common/SingleImageField'
import { TextareaField } from '@/components/common/TextareaField'
import { TextField } from '@/components/common/TextField'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  useAdminCategories,
  useDeleteCategory,
  useSaveCategory,
  type AdminCategory,
} from '@/features/admin/api'
import type { SingleImageValue } from '@/features/artisan/images'
import { categoryIcon } from '@/features/catalog/home-categories'
import { getErrorMessage } from '@/lib/errors'
import { publicUrl, uploadImage } from '@/lib/storage'

/** « Bois d'olivier & Cœur » → « bois-d-olivier-coeur » (même règle que slugify() en SQL). */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const categorySchema = z.object({
  name: z.string().trim().min(2, 'Indiquez le nom de la catégorie.').max(60, 'Nom trop long.'),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug trop court.')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Lettres minuscules, chiffres et tirets uniquement.'),
  description: z.string().trim().max(300, 'Description trop longue (300 caractères maximum).'),
  sortOrder: z
    .string()
    .trim()
    .regex(/^\d{1,4}$/, 'Nombre entier (0 ou plus).'),
  isActive: z.boolean(),
})
type CategoryValues = z.infer<typeof categorySchema>

function CategoryForm({
  category,
  nextOrder,
  onDone,
}: {
  category: AdminCategory | null
  nextOrder: number
  onDone: () => void
}) {
  const save = useSaveCategory()
  const [image, setImage] = useState<SingleImageValue>(
    category?.image_url ? { kind: 'url', url: category.image_url } : null,
  )
  const [uploading, setUploading] = useState(false)
  // Slug automatique tant que l'admin ne l'a pas modifié à la main
  const [slugTouched, setSlugTouched] = useState(Boolean(category))
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? '',
      slug: category?.slug ?? '',
      description: category?.description ?? '',
      sortOrder: String(category?.sort_order ?? nextOrder),
      isActive: category?.is_active ?? true,
    },
  })
  const nameField = register('name')

  const onSubmit = handleSubmit(async (values) => {
    let imageUrl: string | null = null
    if (image?.kind === 'url') imageUrl = image.url
    if (image?.kind === 'file') {
      setUploading(true)
      try {
        imageUrl = publicUrl(
          'category-images',
          await uploadImage('category-images', 'categories', image.file),
        )
      } catch (error) {
        toast.error(getErrorMessage(error))
        return
      } finally {
        setUploading(false)
      }
    }
    save.mutate(
      {
        id: category?.id ?? null,
        input: {
          name: values.name,
          slug: values.slug,
          description: values.description || null,
          image_url: imageUrl,
          sort_order: Number(values.sortOrder),
          is_active: values.isActive,
        },
      },
      {
        onSuccess: () => {
          toast.success(category ? 'Catégorie enregistrée.' : 'Catégorie créée.')
          onDone()
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    )
  })

  const busy = save.isPending || uploading

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-4">
      <TextField
        label="Nom"
        error={errors.name?.message}
        {...nameField}
        onChange={(event) => {
          void nameField.onChange(event)
          if (!slugTouched) setValue('slug', slugify(event.target.value), { shouldValidate: false })
        }}
      />
      <TextField
        label="Slug (adresse)"
        description="Utilisé dans les liens : /catalogue?categorie=…"
        error={errors.slug?.message}
        {...register('slug', { onChange: () => setSlugTouched(true) })}
      />
      <TextareaField
        label="Description"
        rows={3}
        error={errors.description?.message}
        {...register('description')}
      />
      <SingleImageField
        label="Image"
        shape="square"
        maxWidthOrHeight={600}
        description="Facultative : à défaut, une icône est affichée sur l’accueil."
        value={image}
        onChange={setImage}
        disabled={busy}
      />
      <div className="grid grid-cols-2 items-end gap-4">
        <TextField
          label="Ordre d’affichage"
          inputMode="numeric"
          error={errors.sortOrder?.message}
          {...register('sortOrder')}
        />
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <label className="flex h-10 cursor-pointer items-center gap-2 text-sm font-medium">
              <Switch checked={field.value} onCheckedChange={field.onChange} />
              {field.value ? 'Active' : 'Inactive'}
            </label>
          )}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={busy}>
          Annuler
        </Button>
        <Button type="submit" disabled={busy}>
          {busy && <Loader2Icon className="animate-spin" />}
          {category ? 'Enregistrer' : 'Créer la catégorie'}
        </Button>
      </div>
    </form>
  )
}

/** ADM-5 — CRUD des catégories (suppression impossible si elle contient des produits). */
export default function AdminCategoriesPage() {
  const categories = useAdminCategories()
  const remove = useDeleteCategory()
  const [editing, setEditing] = useState<AdminCategory | 'new' | null>(null)
  const [toDelete, setToDelete] = useState<AdminCategory | null>(null)

  const productCount = (category: AdminCategory) => category.products[0]?.count ?? 0
  const nextOrder = Math.max(0, ...(categories.data ?? []).map((c) => c.sort_order)) + 1

  return (
    <div>
      <PageHeader
        title="Catégories"
        description="Une catégorie qui contient des produits ne peut pas être supprimée : désactivez-la."
        actions={
          <Button onClick={() => setEditing('new')}>
            <PlusIcon />
            Nouvelle catégorie
          </Button>
        }
      />

      {categories.isPending ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : categories.isError ? (
        <ErrorState onRetry={() => void categories.refetch()} />
      ) : categories.data.length === 0 ? (
        <EmptyState icon={TagsIcon} title="Aucune catégorie" />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Ordre</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead className="text-right">Produits</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-24">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.data.map((category) => {
                const Icon = categoryIcon(category.slug)
                return (
                  <TableRow key={category.id}>
                    <TableCell>{category.sort_order}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {category.image_url ? (
                          <img
                            src={category.image_url}
                            alt=""
                            className="size-10 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex size-10 items-center justify-center rounded-full bg-secondary text-primary">
                            <Icon className="size-5" aria-hidden="true" />
                          </span>
                        )}
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-xs text-muted-foreground">{category.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{productCount(category)}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={category.is_active ? 'bg-olive/15 text-olive' : 'bg-muted'}
                      >
                        {category.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Modifier ${category.name}`}
                          onClick={() => setEditing(category)}
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive"
                          aria-label={`Supprimer ${category.name}`}
                          onClick={() => setToDelete(category)}
                        >
                          <Trash2Icon />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[90svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing === 'new' ? 'Nouvelle catégorie' : 'Modifier la catégorie'}
            </DialogTitle>
            <DialogDescription>Le slug est généré à partir du nom.</DialogDescription>
          </DialogHeader>
          {editing !== null && (
            <CategoryForm
              category={editing === 'new' ? null : editing}
              nextOrder={nextOrder}
              onDone={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={`Supprimer « ${toDelete?.name} » ?`}
        description={
          toDelete && productCount(toDelete) > 0
            ? `Cette catégorie contient ${productCount(toDelete)} produit(s) : la suppression sera refusée. Désactivez-la plutôt.`
            : 'Cette action est définitive.'
        }
        confirmLabel="Supprimer"
        destructive
        pending={remove.isPending}
        onConfirm={() =>
          toDelete &&
          remove.mutate(toDelete.id, {
            onSuccess: () => {
              toast.success('Catégorie supprimée.')
              setToDelete(null)
            },
            onError: (error) => {
              toast.error(getErrorMessage(error))
              setToDelete(null)
            },
          })
        }
      />
    </div>
  )
}
