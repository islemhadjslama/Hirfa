import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2Icon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { ErrorState } from '@/components/common/ErrorState'
import { PageHeader } from '@/components/common/PageHeader'
import { PageLoader } from '@/components/common/PageLoader'
import { TextField } from '@/components/common/TextField'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useUpdateSettings } from '@/features/admin/api'
import { useAppSettings } from '@/features/cart/api'
import { getErrorMessage } from '@/lib/errors'

const settingsSchema = z.object({
  shippingFee: z
    .string()
    .trim()
    .regex(/^\d{1,4}([.,]\d{1,3})?$/, 'Montant invalide (ex. 7 ou 7,500).'),
  siteName: z.string().trim().min(2, 'Indiquez le nom du site.').max(60, 'Nom trop long.'),
  contactEmail: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || z.email().safeParse(value).success,
      'Adresse email invalide.',
    ),
})
type SettingsValues = z.infer<typeof settingsSchema>

type Settings = { shipping_fee: number; site_name: string; contact_email: string | null }

function SettingsForm({ settings }: { settings: Settings }) {
  const update = useUpdateSettings()
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      shippingFee: settings.shipping_fee.toFixed(3).replace('.', ','),
      siteName: settings.site_name,
      contactEmail: settings.contact_email ?? '',
    },
  })

  const onSubmit = handleSubmit((values) =>
    update.mutate(
      {
        shipping_fee: Number(values.shippingFee.replace(',', '.')),
        site_name: values.siteName,
        contact_email: values.contactEmail || null,
      },
      {
        onSuccess: () => toast.success('Paramètres enregistrés.'),
        onError: (error) => toast.error(getErrorMessage(error)),
      },
    ),
  )

  return (
    <Card>
      <CardContent className="pt-6">
        <form noValidate onSubmit={onSubmit} className="space-y-4">
          <TextField
            label="Frais de livraison par sous-commande (DT)"
            inputMode="decimal"
            description="Appliqués à chaque colis (un par artisan). Les commandes déjà passées gardent leurs frais."
            error={errors.shippingFee?.message}
            {...register('shippingFee')}
          />
          <TextField
            label="Nom du site"
            error={errors.siteName?.message}
            {...register('siteName')}
          />
          <TextField
            label="Email de contact"
            type="email"
            description="Affiché dans le pied de page."
            error={errors.contactEmail?.message}
            {...register('contactEmail')}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={update.isPending || !isDirty}>
              {update.isPending && <Loader2Icon className="animate-spin" />}
              Enregistrer
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

/** ADM-8 — Frais de livraison, nom et email de contact du site. */
export default function AdminSettingsPage() {
  const settings = useAppSettings()

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Paramètres" />
      {settings.isPending ? (
        <PageLoader />
      ) : settings.isError ? (
        <ErrorState onRetry={() => void settings.refetch()} />
      ) : (
        <SettingsForm
          key={`${settings.data.shipping_fee}|${settings.data.site_name}|${settings.data.contact_email}`}
          settings={settings.data}
        />
      )}
    </div>
  )
}
