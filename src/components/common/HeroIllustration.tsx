import { cn } from '@/lib/utils'

/**
 * Illustration vectorielle du hero (générée localement, aucune ressource externe) :
 * une porte bleue de Sidi Bou Saïd encadrant des poteries et un tapis.
 */
export function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 440"
      className={cn('h-auto w-full', className)}
      role="img"
      aria-label="Porte tunisienne bleue encadrant des poteries en terre cuite et un tapis tissé"
    >
      <defs>
        <pattern id="zellige" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#f3e9dc" />
          <path d="M20 2 26 14 38 20 26 26 20 38 14 26 2 20 14 14Z" fill="#c2562f" opacity=".18" />
          <circle cx="20" cy="20" r="3" fill="#1f5fa8" opacity=".35" />
        </pattern>
        <clipPath id="arch">
          <path d="M70 430V190a130 130 0 0 1 260 0v240Z" />
        </clipPath>
      </defs>

      {/* Fond zellige dans l'arche */}
      <path d="M50 440V190a150 150 0 0 1 300 0v250Z" fill="#1f5fa8" />
      <path d="M70 430V190a130 130 0 0 1 260 0v240Z" fill="url(#zellige)" />
      {/* Clous décoratifs de la porte */}
      {[90, 130, 170, 210, 250, 290].map((y) => (
        <g key={y} fill="#f3e9dc">
          <circle cx="60" cy={y + 30} r="3" />
          <circle cx="340" cy={y + 30} r="3" />
        </g>
      ))}

      <g clipPath="url(#arch)">
        {/* Soleil */}
        <circle cx="200" cy="150" r="46" fill="#d9a441" opacity=".85" />
        {/* Tapis kilim */}
        <rect x="70" y="330" width="260" height="110" fill="#6b7a3a" />
        <path d="M70 355h260M70 405h260" stroke="#f3e9dc" strokeWidth="4" />
        {[90, 140, 190, 240, 290].map((x) => (
          <path key={x} d={`M${x} 380l20-15 20 15-20 15Z`} fill="#c2562f" />
        ))}
      </g>

      {/* Grande jarre */}
      <path
        d="M150 340c-30-10-40-60-20-95 8-14 10-22 6-34h48c-4 12-2 20 6 34 20 35 10 85-20 95Z"
        fill="#c2562f"
      />
      <path d="M140 270h60" stroke="#f3e9dc" strokeWidth="5" strokeLinecap="round" />
      <path d="M137 292h66" stroke="#1e1b18" strokeWidth="3" opacity=".25" />
      <rect x="132" y="204" width="56" height="10" rx="4" fill="#a4441f" />

      {/* Petit vase */}
      <path
        d="M248 340c-20-6-26-38-12-60 5-8 6-14 3-22h30c-3 8-2 14 3 22 14 22 8 54-12 60Z"
        fill="#1f5fa8"
      />
      <path d="M236 300h36" stroke="#f3e9dc" strokeWidth="4" strokeLinecap="round" />
      <rect x="236" y="252" width="36" height="8" rx="3" fill="#174a85" />

      {/* Bol */}
      <path d="M95 320h50a25 25 0 0 1-50 0Z" fill="#d9a441" />
      <path d="M104 328h32" stroke="#c2562f" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
