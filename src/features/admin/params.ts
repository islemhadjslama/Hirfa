/** Numéro de page lu dans l'URL (`?page=`), 1 par défaut. */
export function pageFromParams(params: URLSearchParams): number {
  const page = Number(params.get('page') ?? '1')
  return Number.isInteger(page) && page > 0 ? page : 1
}
