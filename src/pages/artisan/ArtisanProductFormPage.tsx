import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftIcon, Loader2Icon, PackageXIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'

import { EmptyState } from '@/components/common/EmptyState'
import { ErrorState } from '@/components/common/ErrorState'
import { ImageUploader } from '@/components/common/ImageUploader'
import { PageHeader } from '@/components/common/PageHeader'
import { PageLoader } from '@/components/common/PageLoader'
import { ProductStatusBadge } from '@/components/common/StatusBadge'
import { SelectField } from '@/components/common/SelectField'
import { TextareaField } from '@/components/common/TextareaField'
import { TextField } from '@/components/common/TextField'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ProductImagesError,
  useMyProduct,
  useSaveProduct,
  type ArtisanProduct,
} from '@/features/artisan/api'
import type { ImageItem } from '@/features/artisan/images'
import { priceToInput, productSchema, type ProductValues } from '@/features/artisan/schemas'
import { useCategories } from '@/features/catalog/api'
import { useProfile } from '@/hooks/useProfile'
import { getErrorMessage } from '@/lib/errors'
import { PRODUCT_STATUS_LABELS } from '@/lib/labels'
import { publicUrl } from '@/lib/storage'

/** ART-4 — `/artisan/produits/nouveau` et `/artisan/produits/:id/modifier`. */
export default function ArtisanProductFormPage() {
  const { id } = useParams()
  const productId = id ? Number(id) : null
  const validId = productId === null || (Number.isInteger(productId) && productId > 0)
  const product = useMyProduct(validId ? productId : null)

  if (!validId || (productId !== null && product.isSuccess && !product.data)) {
    return (
      <EmptyState
        icon={PackageXIcon}
        title="Produit introuvable"
        description="Ce produit n’existe pas ou ne vous appartient pas."
        action={
          <Button variant="outline" asChild>
            <Link to="/artisan/produits">Retour à mes produits</Link>
          </Button>
        }
      />
    )
  }
  if (productId !== null && product.isPending) return <PageLoader />
  if (product.isError) return <ErrorState onRetry={() => void product.refetch()} />

  // `key` : après un enregistrement (même partiel), le formulaire repart de l'état serveur
  return (
    <ProductForm
      key={productId === null ? 'new' : `${productId}-${product.dataUpdatedAt}`}
      product={product.data ?? null}
    />
  )
}

function toImageItems(product: ArtisanProduct | null): ImageItem[] {
  return (product?.product_images ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((image) => ({
      key: `existing-${image.id}`,
      kind: 'existing' as const,
      id: image.id,
      path: image.path,
      url: publicUrl('product-images', image.path),
    }))
}

function ProductForm({ product }: { product: ArtisanProduct | null }) {
  const navigate = useNavigate()
  const { profile } = useProfile()
  const categories = useCategories()
  const save = useSaveProduct()
  const [images, setImages] = useState<ImageItem[]>(() => toImageItems(product))
  const [imagesError, setImagesError] = useState<string>()
  const isEdit = product !== null

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: product?.name ?? '',
      description: product?.description ?? '',
      categoryId: product ? String(product.category_id) : '',
      price: product ? priceToInput(product.price) : '',
      stock: product ? String(product.stock) : '1',
      status: product?.status ?? 'published',
    },
  })

  const onSubmit = handleSubmit((values) => {
    if (images.length === 0) {
      setImagesError('Ajoutez au moins une image.')
      return
    }
    if (!profile) return
    setImagesError(undefined)
    save.mutate(
      {
        artisanId: profile.id,
        productId: product?.id ?? null,
        values,
        images,
        originalImages: product?.product_images ?? [],
      },
      {
        onSuccess: () => {
          toast.success(isEdit ? 'Produit enregistré.' : 'Produit créé.')
          navigate('/artisan/produits')
        },
        onError: (error) => {
          toast.error(getErrorMessage(error), { duration: 8000 })
          // Produit créé mais images en échec : on bascule sur sa page de modification
          if (error instanceof ProductImagesError && !isEdit) {
            navigate(`/artisan/produits/${error.productId}/modifier`, { replace: true })
          }
        },
      },
    )
  })

  const categoryOptions = (categories.data ?? []).map((category) => ({
    value: String(category.id),
    label: category.name,
  }))
  // Catégorie désactivée par l'admin depuis : on la garde sélectionnable pour ce produit
  if (product && !categoryOptions.some((option) => option.value === String(product.category_id))) {
    categoryOptions.push({ value: String(product.category_id), label: 'Catégorie désactivée' })
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
        <Link to="/artisan/produits">
          <ArrowLeftIcon />
          Mes produits
        </Link>
      </Button>
      <PageHeader
        title={isEdit ? 'Modifier le produit' : 'Nouveau produit'}
        description={
          product && (
            <ProductStatusBadge status={product.status} adminHidden={product.admin_hidden} />
          )
        }
      />

      {product?.admin_hidden && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>
            Ce produit a été masqué par l’administration : il n’apparaît pas dans le catalogue, même
            publié.
          </AlertDescription>
        </Alert>
      )}

      <form noValidate onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-lg font-semibold">Informations</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TextField
              label="Nom du produit"
              placeholder="Ex. Jarre en terre cuite de Nabeul"
              error={errors.name?.message}
              {...register('name')}
            />
            <TextareaField
              label="Description"
              rows={6}
              placeholder="Matières, dimensions, technique, conseils d’entretien…"
              error={errors.description?.message}
              {...register('description')}
            />
            <SelectField
              label="Catégorie"
              placeholder={categories.isPending ? 'Chargement…' : 'Choisir une catégorie'}
              options={categoryOptions}
              disabled={categories.isPending}
              error={errors.categoryId?.message}
              {...register('categoryId')}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label="Prix (DT)"
                inputMode="decimal"
                placeholder="45,000"
                description="Jusqu’à 3 décimales (millimes)."
                error={errors.price?.message}
                {...register('price')}
              />
              <TextField
                label="Stock disponible"
                inputMode="numeric"
                error={errors.stock?.message}
                {...register('stock')}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-lg font-semibold">Images</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImageUploader
              value={images}
              onChange={(next) => {
                setImages(next)
                if (next.length > 0) setImagesError(undefined)
              }}
              error={imagesError}
              disabled={save.isPending}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-lg font-semibold">Visibilité</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <fieldset className="space-y-3">
              <legend className="mb-3 text-sm font-medium">Statut</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {(['published', 'draft'] as const).map((value) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border p-4 has-checked:border-primary has-checked:bg-primary/5"
                  >
                    <input
                      type="radio"
                      value={value}
                      className="mt-1 accent-primary"
                      {...register('status')}
                    />
                    <span>
                      <span className="block font-medium">{PRODUCT_STATUS_LABELS[value]}</span>
                      <span className="text-sm text-muted-foreground">
                        {value === 'published'
                          ? 'Visible dans le catalogue et disponible à la commande.'
                          : 'Invisible pour les clients. Vous pourrez le publier plus tard.'}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </CardContent>
        </Card>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="lg" asChild>
            <Link to="/artisan/produits">Annuler</Link>
          </Button>
          <Button type="submit" size="lg" disabled={save.isPending}>
            {save.isPending && <Loader2Icon className="animate-spin" />}
            {save.isPending
              ? 'Enregistrement…'
              : isEdit
                ? 'Enregistrer les modifications'
                : 'Créer le produit'}
          </Button>
        </div>
      </form>
    </div>
  )
}
