import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const monthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'short' })
const monthLongFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })

/** « 2026-06 » → date du 1er du mois (heure locale). */
const monthDate = (month: string) => new Date(`${month}-01T12:00:00`)

type MonthlyBarChartProps = {
  data: { month: string; value: number }[]
  /** Libellé de la valeur, ex. « commandes ». */
  unit: string
  /** Formatage des valeurs (axe, info-bulle, tableau). */
  format?: (value: number) => string
  title: string
}

/**
 * Histogramme mensuel à une seule série (pas de légende : le titre la nomme).
 * Barres fines à bords arrondis, grille discrète, info-bulle au survol et
 * tableau équivalent pour les lecteurs d'écran.
 */
export function MonthlyBarChart({ data, unit, format = String, title }: MonthlyBarChartProps) {
  const rows = data.map((d) => ({ ...d, label: monthFormatter.format(monthDate(d.month)) }))

  return (
    <figure className="space-y-2">
      <figcaption className="font-sans text-sm font-semibold tracking-normal">{title}</figcaption>
      <div className="h-56 w-full" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
            barCategoryGap="30%"
          >
            <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="0" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={48}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              tickFormatter={(value: number) => format(value)}
            />
            <Tooltip
              cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
              contentStyle={{
                background: 'var(--popover)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--popover-foreground)',
                fontSize: 13,
              }}
              labelFormatter={(_, payload) => {
                const month = payload?.[0]?.payload?.month as string | undefined
                return month ? monthLongFormatter.format(monthDate(month)) : ''
              }}
              formatter={(value) => [`${format(Number(value))}`, unit]}
            />
            <Bar
              dataKey="value"
              fill="var(--hirfa-terracotta)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              // Pas d'animation : rendu immédiat et respect des préférences de mouvement réduit
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Mois</th>
            <th scope="col">{unit}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.month}>
              <th scope="row">{monthLongFormatter.format(monthDate(row.month))}</th>
              <td>{format(row.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
