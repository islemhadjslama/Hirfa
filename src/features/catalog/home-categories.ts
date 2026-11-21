import type { LucideIcon } from 'lucide-react'
import {
  AmphoraIcon,
  BriefcaseIcon,
  CookingPotIcon,
  GemIcon,
  LampIcon,
  LeafIcon,
  ScissorsIcon,
  ShoppingBasketIcon,
  SpoolIcon,
  TreeDeciduousIcon,
  WineIcon,
} from 'lucide-react'

export type HomeCategory = {
  name: string
  slug: string
  icon: LucideIcon
}

/**
 * Catégories affichées sur l'accueil STATIQUE (Phase 0).
 * Les slugs correspondent à ceux de `supabase/seed.sql` (Phase 1).
 * En Phase 4, cette liste sera remplacée par les catégories lues en base.
 */
export const HOME_CATEGORIES: HomeCategory[] = [
  { name: 'Poterie & céramique', slug: 'poterie-ceramique', icon: AmphoraIcon },
  { name: 'Tapis & tissage', slug: 'tapis-tissage', icon: SpoolIcon },
  { name: 'Bijoux', slug: 'bijoux', icon: GemIcon },
  { name: 'Cuir & maroquinerie', slug: 'cuir-maroquinerie', icon: BriefcaseIcon },
  { name: 'Vannerie', slug: 'vannerie', icon: ShoppingBasketIcon },
  { name: "Bois d'olivier", slug: 'bois-olivier', icon: TreeDeciduousIcon },
  { name: 'Broderie & textile', slug: 'broderie-textile', icon: ScissorsIcon },
  { name: 'Cuivre & dinanderie', slug: 'cuivre-dinanderie', icon: CookingPotIcon },
  { name: 'Verre soufflé', slug: 'verre-souffle', icon: WineIcon },
  { name: 'Décoration', slug: 'decoration', icon: LampIcon },
  { name: 'Savons & cosmétiques naturels', slug: 'savons-cosmetiques-naturels', icon: LeafIcon },
]
