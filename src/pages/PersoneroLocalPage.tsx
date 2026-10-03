import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { PollingTableLite } from '../api/adminTypes'
import { useAuth } from '../auth/AuthContext'
import { VoteForm } from '../components/VoteForm'
import { cn } from '../ui/styles'

export function PersoneroLocalPage() {
  const { user } = useAuth()
  const schoolId = user?.scopes.find((s) => s.school_id)?.school_id ?? null
  const [tables, setTables] = useState<PollingTableLite[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!schoolId) return
    api
      .get<PollingTableLite[]>(`/tables?school_id=${schoolId}`)
      .then((data) => {
        setTables(data)
        if (data.length) setSelected(data[0].id)
      })
      .catch(() => setError('No se pudieron cargar las mesas del local.'))
  }, [schoolId])

  if (!schoolId)
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
        No tiene un centro educativo asignado.
      </p>
    )

  return (
    <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
          Mesas del local
        </h3>
        <div className="flex flex-wrap gap-2 lg:flex-col">
          {tables.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelected(t.id)}
              className={cn(
                'flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition',
                selected === t.id
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-50',
              )}
            >
              <span className="font-medium">Mesa {t.number}</span>
              <span className="text-xs text-ink-400">{t.electores_habilitados} elect.</span>
            </button>
          ))}
          {!tables.length && <p className="text-sm text-ink-500">Sin mesas asignadas.</p>}
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </aside>

      <main className="rounded-2xl border border-ink-200 bg-white p-4 sm:p-6">
        {selected ? <VoteForm tableId={selected} /> : <p className="text-sm text-ink-500">Sin mesas.</p>}
      </main>
    </div>
  )
}
