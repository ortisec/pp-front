export const inputClass =
  'w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-ink-50 disabled:text-ink-400'

export const labelClass = 'flex flex-col gap-1 text-xs font-medium text-ink-600'

export const btnPrimary =
  'inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50'

export const btnSecondary =
  'inline-flex items-center justify-center rounded-lg border border-ink-200 bg-white px-4 py-2 text-sm font-medium text-ink-700 transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-50'

export const badgeClass: Record<string, string> = {
  CONFIRMADO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  BORRADOR: 'bg-amber-50 text-amber-700 border-amber-200',
  SIN_DATOS: 'bg-ink-100 text-ink-500 border-ink-200',
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
