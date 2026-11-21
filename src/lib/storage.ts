import imageCompression from 'browser-image-compression'

import { MAX_IMAGE_SIZE_MB } from '@/lib/constants'
import { supabase } from '@/lib/supabase'

export type Bucket = 'product-images' | 'shop-assets' | 'category-images' | 'avatars'

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const ACCEPTED_IMAGE_INPUT = ACCEPTED_IMAGE_TYPES.join(',')

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/** URL publique d'un fichier (les buckets Hirfa sont publics en lecture). */
export function publicUrl(bucket: Bucket, path: string): string {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

/** Chemin Storage à partir d'une URL publique (null si l'URL vient d'ailleurs). */
export function pathFromPublicUrl(bucket: Bucket, url: string | null): string | null {
  if (!url) return null
  const marker = `/storage/v1/object/public/${bucket}/`
  const index = url.indexOf(marker)
  return index === -1 ? null : decodeURIComponent(url.slice(index + marker.length))
}

/**
 * Vérifie le format puis compresse l'image côté navigateur (WebP si possible).
 * Lève une erreur en français si le format est refusé ou si l'image reste > 2 Mo.
 */
export async function compressImage(file: File, maxWidthOrHeight = 1600): Promise<File> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`« ${file.name} » : format non accepté (JPG, PNG ou WebP uniquement).`)
  }
  let compressed: File
  try {
    compressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight,
      // Pas de Web Worker : la librairie le chargerait depuis un CDN externe.
      useWebWorker: false,
      fileType: 'image/webp',
      initialQuality: 0.85,
    })
  } catch {
    throw new Error(`« ${file.name} » : image illisible ou corrompue.`)
  }
  if (compressed.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    throw new Error(`« ${file.name} » : image trop lourde (${MAX_IMAGE_SIZE_MB} Mo maximum).`)
  }
  return compressed
}

/**
 * Envoie un fichier dans `{dossier}/{uuid}.{ext}` et retourne son chemin.
 * Le premier dossier doit être l'id de l'utilisateur (politiques Storage).
 */
export async function uploadImage(bucket: Bucket, folder: string, file: File): Promise<string> {
  const extension = EXTENSIONS[file.type] ?? 'webp'
  const path = `${folder}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    cacheControl: '31536000',
    upsert: false,
  })
  if (error) throw new Error('Échec de l’envoi d’une image. Vérifiez votre connexion et réessayez.')
  return path
}

/** Suppression « au mieux » : un échec ne bloque pas l'action de l'utilisateur. */
export async function removeFiles(bucket: Bucket, paths: string[]): Promise<void> {
  if (paths.length === 0) return
  await supabase.storage.from(bucket).remove(paths)
}
