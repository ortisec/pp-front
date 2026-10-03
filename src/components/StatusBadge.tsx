import { cn, badgeClass } from '../ui/styles'

const LABELS: Record<string, string> = {
  CONFIRMADO: 'Confirmado',
  BORRADOR: 'Borrador',
  SIN_DATOS: 'Sin datos',
  ADMIN: 'Administrador',
  PERSONERO_MESA: 'Personero de mesa',
  PERSONERO_LOCAL: 'Personero de local',
}

export function StatusBadge({ status }: { status: string }) {
  const key = status?.toUpperCase?.() ?? 'SIN_DATOS'
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        badgeClass[key] ?? badgeClass.SIN_DATOS,
      )}
    >
      {LABELS[key] ?? status}
    </span>
  )
}
