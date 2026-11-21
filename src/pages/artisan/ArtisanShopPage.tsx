import { zodResolver } from '@hookform/resolvers/zod'
import { ExternalLinkIcon, Loader2Icon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'

import { PageHeader } from '@/components/common/PageHeader'
import { PageLoader } from '@/components/common/PageLoader'
import { SelectField } from '@/components/common/SelectField'
import { SingleImageField } from '@/components/common/SingleImageField'
import { TextareaField } from '@/components/common/TextareaField'
import { TextField } from '@/components/common/TextField'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Profile } from '@/features/auth/api'
import { useUpdateShop } from '@/features/artisan/api'
import type { SingleImageValue } from '@/features/artisan/images'
import { formatWhatsapp, shopSchema, type ShopValues } from '@/features/artisan/schemas'
import { useCategories } from '@/features/catalog/api'
import { useProfile } from '@/hooks/useProfile'
import { GOVERNORATES } from '@/lib/constants'
import { getErrorMessage } from '@/lib/errors'

const GOVERNORATE_OPTIONS = GOVERNORATES.map((name) => ({ value: name, label: name }))

type Shop = NonNullable<Profile['artisan_profiles']>

/** ART-2 — Modifier sa boutique (accessible même si elle n'est pas approuvée). */
export default function ArtisanShopPage() {
  const { profile, isLoading } = useProfile()
  const shop = profile?.artisan_profiles

  if (isLoading) return <PageLoader />
  if (!shop) return null
  // `key` : le formulaire repart des données enregistrées après chaque sauvegarde
  return <ShopForm key={shop.updated_at} shop={shop} />
}

function ShopForm({ shop }: { shop: Shop }) {
  const navigate = useNavigate()
  const categories = useCategories()
  const updateShop = useUpdateShop()
  const [logo, setLogo] = useState<SingleImageValue>(
    shop.logo_url ? { kind: 'url', url: shop.logo_url } : null,
  )
  const [banner, setBanner] = useState<SingleImageValue>(
    shop.banner_url ? { kind: 'url', url: shop.banner_url } : null,
  )
  const isRejected = shop.status === 'rejected'

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ShopValues>({
    resolver: zodResolver(shopSchema),
    defaultValues: {
      shopName: shop.shop_name,
      bio: shop.bio ?? '',
      specialtyCategoryId: shop.specialty_category_id ? String(shop.specialty_category_id) : '',
      governorate: shop.governorate ?? '',
      city: shop.city ?? '',
      address: shop.address ?? '',
      facebookUrl: shop.facebook_url ?? '',
      instagramUrl: shop.instagram_url ?? '',
      whatsapp: formatWhatsapp(shop.whatsapp),
    },
  })

  const imagesChanged =
    (logo?.url ?? null) !== shop.logo_url || (banner?.url ?? null) !== shop.banner_url

  const onSubmit = handleSubmit((values) =>
    updateShop.mutate(
      {
        artisanId: shop.id,
        values,
        logo,
        banner,
        previousLogoUrl: shop.logo_url,
        previousBannerUrl: shop.banner_url,
        resubmit: isRejected,
      },
      {
        onSuccess: () => {
          if (isRejected) {
            toast.success('Boutique enregistrée et demande de validation renvoyée.')
            navigate('/artisan/en-attente')
          } else {
            toast.success('Votre boutique a été enregistrée.')
          }
        },
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    ),
  )

  const categoryOptions = (categories.data ?? []).map((category) => ({
    value: String(category.id),
    label: category.name,
  }))

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Ma boutique"
        description="Ces informations apparaissent sur votre page publique."
        actions={
          shop.status === 'approved' && (
            <Button variant="outline" asChild>
              <Link to={`/artisans/${shop.slug}`}>
                <ExternalLinkIcon />
                Voir ma boutique publique
              </Link>
            </Button>
          )
        }
      />

      {isRejected && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Demande refusée</AlertTitle>
          <AlertDescription>
            <p>Motif : {shop.rejection_reason || 'aucun motif précisé.'}</p>
            <p>Corrigez votre boutique : l’enregistrement renverra votre demande de validation.</p>
          </AlertDescription>
        </Alert>
      )}

      <form noValidate onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-lg font-semibold">Présentation</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TextField
              label="Nom de la boutique"
              error={errors.shopName?.message}
              {...register('shopName')}
            />
            <TextareaField
              label="Présentation"
              rows={5}
              placeholder="Votre histoire, votre savoir-faire, vos matières…"
              description="1 500 caractères maximum."
              error={errors.bio?.message}
              {...register('bio')}
            />
            <SelectField
              label="Spécialité"
              placeholder={categories.isPending ? 'Chargement…' : 'Choisir une catégorie'}
              options={categoryOptions}
              disabled={categories.isPending}
              error={errors.specialtyCategoryId?.message}
              {...register('specialtyCategoryId')}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-lg font-semibold">Images</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <SingleImageField
              label="Logo"
              shape="square"
              maxWidthOrHeight={600}
              description="Image carrée de préférence. JPG, PNG ou WebP."
              value={logo}
              onChange={setLogo}
              disabled={updateShop.isPending}
            />
            <SingleImageField
              label="Bannière"
              shape="wide"
              maxWidthOrHeight={1800}
              description="Format large (environ 3:1). JPG, PNG ou WebP."
              value={banner}
              onChange={setBanner}
              disabled={updateShop.isPending}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-lg font-semibold">Localisation</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Gouvernorat"
                placeholder="Choisir un gouvernorat"
                options={GOVERNORATE_OPTIONS}
                error={errors.governorate?.message}
                {...register('governorate')}
              />
              <TextField label="Ville" error={errors.city?.message} {...register('city')} />
            </div>
            <TextField
              label="Adresse de l’atelier"
              description="Facultatif."
              error={errors.address?.message}
              {...register('address')}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="text-lg font-semibold">Réseaux sociaux</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <TextField
              label="Page Facebook"
              type="url"
              placeholder="https://facebook.com/ma-boutique"
              error={errors.facebookUrl?.message}
              {...register('facebookUrl')}
            />
            <TextField
              label="Compte Instagram"
              type="url"
              placeholder="https://instagram.com/ma-boutique"
              error={errors.instagramUrl?.message}
              {...register('instagramUrl')}
            />
            <TextField
              label="WhatsApp"
              type="tel"
              inputMode="tel"
              placeholder="22 123 456"
              description="Les clients pourront vous écrire depuis votre boutique."
              error={errors.whatsapp?.message}
              {...register('whatsapp')}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={updateShop.isPending || (!isDirty && !imagesChanged && !isRejected)}
          >
            {updateShop.isPending && <Loader2Icon className="animate-spin" />}
            {isRejected ? 'Enregistrer et resoumettre' : 'Enregistrer'}
          </Button>
        </div>
      </form>
    </div>
  )
}
