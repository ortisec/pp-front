interface Segment {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  segments: Segment[]
  size?: number
  thickness?: number
  centerLabel?: string
  centerValue?: string
}

export function DonutChart({
  segments,
  size = 160,
  thickness = 22,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const total = segments.reduce((a, s) => a + s.value, 0)
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-ink-100)"
            strokeWidth={thickness}
          />
          {total > 0 &&
            segments.map((s, i) => {
              const fraction = s.value / total
              const dash = fraction * circumference
              const el = (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                />
              )
              offset += dash
              return el
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold text-ink-900">{centerValue}</span>
          <span className="text-xs text-ink-500">{centerLabel}</span>
        </div>
      </div>

      <ul className="flex flex-col gap-1.5">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-ink-700">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
            <span>{s.label}</span>
            <strong className="ml-auto text-ink-900">
              {total ? ((s.value / total) * 100).toFixed(1) : '0.0'}%
            </strong>
          </li>
        ))}
      </ul>
    </div>
  )
}
