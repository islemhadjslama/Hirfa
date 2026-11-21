import { useEffect } from 'react'

export const DEFAULT_TITLE = 'Hirfa — Artisanat tunisien'

/** Titre de l'onglet : « Catalogue · Hirfa ». */
export function pageTitle(title: string | null | undefined): string {
  return title ? `${title} · Hirfa` : DEFAULT_TITLE
}

/** Pour les pages dont le titre dépend des données (fiche produit, boutique). */
export function usePageTitle(title: string | null | undefined) {
  useEffect(() => {
    document.title = pageTitle(title)
  }, [title])
}
