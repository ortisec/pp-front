interface BarDatum {
  label: string
  value: number
  hint?: string
}

interface VerticalBarsProps {
  data: BarDatum[]
  max?: number
  unit?: string
  color?: string
  height?: number
}

export function VerticalBars({
  data,
  max,
  unit = '%',
  color = 'var(--color-brand-500)',
  height = 180,
}: VerticalBarsProps) {
  const top = max ?? Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="flex items-end gap-3 overflow-x-auto pb-1" style={{ minHeight: height }}>
      {data.map((d, i) => {
        const h = Math.max(4, (d.value / top) * (height - 40))
        return (
          <div key={i} className="flex min-w-[56px] flex-1 flex-col items-center gap-1.5">
            <span className="text-xs font-semibold text-ink-900">
              {d.value.toFixed(1)}
              {unit}
            </span>
            <div
              className="w-full max-w-[52px] rounded-t-md transition-all"
              style={{ height: h, background: color }}
              title={d.hint}
            />
            <span
              className="line-clamp-2 max-w-[72px] text-center text-[11px] leading-tight text-ink-500"
              title={d.label}
            >
              {d.label}
            </span>
          </div>
        )
      })}
      {!data.length && <p className="text-sm text-ink-400">Sin datos.</p>}
    </div>
  )
}
