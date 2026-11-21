/** Auteur d'un changement de statut, vu par le client ou par l'artisan. */
export function actorLabel(
  changedBy: string | null,
  context: { clientId: string; artisanId: string; artisanName: string },
  viewer: 'client' | 'artisan' | 'admin',
): string {
  if (changedBy === context.clientId) return viewer === 'client' ? 'par vous' : 'par le client'
  if (changedBy === context.artisanId) {
    return viewer === 'artisan' ? 'par vous' : `par ${context.artisanName}`
  }
  if (changedBy === null) return ''
  return 'par l’administration'
}
