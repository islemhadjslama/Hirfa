/** Image affichée dans un formulaire : déjà enregistrée, ou nouvelle (pas encore envoyée). */
export type ImageItem =
  | { key: string; kind: 'existing'; id: number; path: string; url: string }
  | { key: string; kind: 'new'; file: File; url: string }

/** Logo ou bannière : URL existante, nouveau fichier, ou rien. */
export type SingleImageValue =
  { kind: 'url'; url: string } | { kind: 'file'; file: File; url: string } | null
