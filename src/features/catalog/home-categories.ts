import type { LucideIcon } from 'lucide-react'
import {
  AmphoraIcon,
  BriefcaseIcon,
  CookingPotIcon,
  FlowerIcon,
  GemIcon,
  LampIcon,
  LeafIcon,
  ScissorsIcon,
  ShoppingBasketIcon,
  SpoolIcon,
  TreeDeciduousIcon,
  WineIcon,
} from 'lucide-react'

/** Icône de chaque catégorie du seed, utilisée quand la catégorie n'a pas d'image. */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'poterie-ceramique': AmphoraIcon,
  'tapis-tissage': SpoolIcon,
  bijoux: GemIcon,
  'cuir-maroquinerie': BriefcaseIcon,
  vannerie: ShoppingBasketIcon,
  'bois-olivier': TreeDeciduousIcon,
  'broderie-textile': ScissorsIcon,
  'cuivre-dinanderie': CookingPotIcon,
  'verre-souffle': WineIcon,
  decoration: LampIcon,
  'savons-cosmetiques-naturels': LeafIcon,
}

export function categoryIcon(slug: string): LucideIcon {
  return CATEGORY_ICONS[slug] ?? FlowerIcon
}
