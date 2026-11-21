/**
 * Génération locale d'images PNG « placeholder » (aucun téléchargement externe) :
 * motifs géométriques aux couleurs de Hirfa, encodés en PNG avec zlib.
 */
import { deflateSync } from 'node:zlib'

type Rgb = [number, number, number]

export const PALETTE: Rgb[] = [
  [194, 86, 47], // terre cuite
  [107, 122, 58], // olive
  [31, 95, 168], // bleu de Sidi Bou Saïd
  [217, 164, 65], // ocre
  [138, 90, 68], // brun
  [243, 233, 220], // sable
  [30, 27, 24], // encre
]

export type Pattern = 'zellige' | 'stripes' | 'checker' | 'circles' | 'kilim'

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buffer: Buffer): number {
  let c = 0xffffffff
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

/** Couleur du pixel (x, y) pour un motif donné. */
function pixel(pattern: Pattern, x: number, y: number, size: number, a: Rgb, b: Rgb, c: Rgb): Rgb {
  const cell = size / 6
  switch (pattern) {
    case 'stripes':
      return Math.floor((x + y) / (cell / 1.5)) % 2 === 0 ? a : b
    case 'checker':
      return (Math.floor(x / cell) + Math.floor(y / cell)) % 2 === 0 ? a : b
    case 'circles': {
      const cx = (x % cell) - cell / 2
      const cy = (y % cell) - cell / 2
      const d = Math.sqrt(cx * cx + cy * cy)
      return d < cell * 0.32 ? b : d < cell * 0.4 ? c : a
    }
    case 'kilim': {
      const band = Math.floor(y / (cell / 2)) % 4
      const dx = Math.abs((x % cell) - cell / 2)
      const dy = Math.abs((y % (cell / 2)) - cell / 4)
      if (band === 1 && dx + dy * 2 < cell / 3) return c
      return band % 2 === 0 ? a : b
    }
    default: {
      // zellige : étoiles en losange sur fond uni
      const cx = Math.abs((x % cell) - cell / 2)
      const cy = Math.abs((y % cell) - cell / 2)
      if (cx + cy < cell * 0.22) return c
      if (cx + cy < cell * 0.38 || Math.max(cx, cy) < cell * 0.12) return b
      return a
    }
  }
}

/** PNG `width` × `height` (RVB 8 bits), carré par défaut. */
export function placeholderPng(
  pattern: Pattern,
  colors: [Rgb, Rgb, Rgb],
  width = 600,
  height = width,
): Buffer {
  const [a, b, c] = colors
  const raw = Buffer.alloc((width * 3 + 1) * height)
  let offset = 0
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0 // filtre « None »
    for (let x = 0; x < width; x++) {
      const [r, g, bl] = pixel(pattern, x, y, height, a, b, c)
      raw[offset++] = r
      raw[offset++] = g
      raw[offset++] = bl
    }
  }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8 // profondeur
  header[9] = 2 // RVB
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}
