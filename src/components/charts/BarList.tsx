interface BarListItem {
  label: string
  value: number
  secondary?: string
  color?: string | null
}

interface BarListProps {
  items: BarListItem[]
  max?: number
  unit?: string
}

export function BarList({ items, max, unit = '' }: BarListProps) {
  const top = max ?? Math.max(1, ...items.map((i) => i.value))
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item, idx) => (
        <li key={`${item.label}-${idx}`}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-2 text-ink-700">
              {item.color && (
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
              )}
              <span className="truncate">{item.label}</span>
            </span>
            <span className="shrink-0 font-semibold text-ink-900">
              {item.value.toLocaleString()}
              {unit && <span className="ml-1 text-xs font-normal text-ink-400">{unit}</span>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.max(2, (item.value / top) * 100)}%`,
                background: item.color ?? 'var(--color-brand-500)',
              }}
            />
          </div>
          {item.secondary && <p className="mt-0.5 text-xs text-ink-400">{item.secondary}</p>}
        </li>
      ))}
      {!items.length && <li className="py-4 text-center text-sm text-ink-400">Sin datos.</li>}
    </ul>
  )
}
