import { useEffect, useMemo, useState } from 'react'
import { ApiError, api } from '../api/client'
import type { Category, TableContext, VoteRecordResponse } from '../api/types'
import { CATEGORIES, CATEGORY_LABELS } from '../api/types'
import { StatusBadge } from './StatusBadge'
import { btnPrimary, btnSecondary, cn, inputClass, labelClass } from '../ui/styles'

interface Props {
  tableId: number
  onSaved?: (res: VoteRecordResponse) => void
}

interface CategoryGrid {
  validos: Record<number, number>
  nulos: number
  blancos: number
}

type Grid = Record<Category, CategoryGrid>

function emptyGrid(parties: Record<Category, number[]>): Grid {
  const grid = {} as Grid
  for (const cat of CATEGORIES) {
    const validos: Record<number, number> = {}
    for (const pid of parties[cat] ?? []) validos[pid] = 0
    grid[cat] = { validos, nulos: 0, blancos: 0 }
  }
  return grid
}

export function VoteForm({ tableId, onSaved }: Props) {
  const [ctx, setCtx] = useState<TableContext | null>(null)
  const [grid, setGrid] = useState<Grid | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [comment, setComment] = useState('')
  const [electoresHab, setElectoresHab] = useState(0)
  const [totalAsistentes, setTotalAsistentes] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    setSaved('')
    try {
      const data = await api.get<TableContext>(`/tables/${tableId}`)
      setCtx(data)
      if (data.record) {
        const next = emptyGrid(data.table_parties)
        for (const e of data.record.entries) {
          const cat = next[e.category]
          if (!cat) continue
          if (e.vote_type === 'VALIDO' && e.party_id != null) cat.validos[e.party_id] = e.quantity
          else if (e.vote_type === 'NULO') cat.nulos = e.quantity
          else if (e.vote_type === 'BLANCO') cat.blancos = e.quantity
        }
        setGrid(next)
        setComment(data.record.comment ?? '')
        setTotalAsistentes(data.record.total_asistentes)
      } else {
        setGrid(emptyGrid(data.table_parties))
        setComment('')
        setTotalAsistentes(0)
      }
      setElectoresHab(data.table.electores_habilitados)
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : 'Error al cargar la mesa')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId])

  const partyById = useMemo(() => {
    const map = new Map<number, string>()
    ctx?.parties.forEach((p) => map.set(p.id, `${p.name}${p.code ? ` (${p.code})` : ''}`))
    return map
  }, [ctx])

  function setValido(cat: Category, pid: number, value: number) {
    if (!grid) return
    setGrid({
      ...grid,
      [cat]: { ...grid[cat], validos: { ...grid[cat].validos, [pid]: value } },
    })
    setSaved('')
  }

  function setNumber(cat: Category, field: 'nulos' | 'blancos', value: number) {
    if (!grid) return
    setGrid({ ...grid, [cat]: { ...grid[cat], [field]: value } })
    setSaved('')
  }

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    if (!grid) return totals
    for (const cat of CATEGORIES) {
      const g = grid[cat]
      const validos = Object.values(g.validos).reduce((a, b) => a + (b || 0), 0)
      totals[cat] = validos + (g.nulos || 0) + (g.blancos || 0)
    }
    return totals
  }, [grid])

  const allBalanced = CATEGORIES.every((c) => categoryTotals[c] === totalAsistentes)

  function buildEntries() {
    const entries = []
    for (const cat of CATEGORIES) {
      const g = grid![cat]
      for (const [pid, qty] of Object.entries(g.validos)) {
        entries.push({
          category: cat,
          vote_type: 'VALIDO',
          party_id: Number(pid),
          quantity: qty || 0,
        })
      }
      entries.push({ category: cat, vote_type: 'NULO', party_id: null, quantity: g.nulos || 0 })
      entries.push({ category: cat, vote_type: 'BLANCO', party_id: null, quantity: g.blancos || 0 })
    }
    return entries
  }

  async function save() {
    if (!grid) return
    setError('')
    setSaved('')
    setSaving(true)
    try {
      const body = {
        electores_habilitados: electoresHab,
        total_asistentes: totalAsistentes,
        comment: comment.trim() || null,
        entries: buildEntries(),
      }
      const res = ctx?.record
        ? await api.put<VoteRecordResponse>(`/votes/${ctx.record.id}`, body)
        : await api.post<VoteRecordResponse>(`/tables/${tableId}/votes`, body)
      setCtx((prev) => (prev ? { ...prev, record: res.record } : prev))
      setSaved('Datos guardados correctamente.')
      onSaved?.(res)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? typeof err.detail === 'string'
            ? err.detail
            : 'Los votos no cuadran con el total de asistentes'
          : 'Error al guardar',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-ink-500">Cargando mesa...</p>
  if (!ctx || !grid) return <p className="text-sm text-red-600">{error || 'Mesa no disponible'}</p>

  const ausentismo = Math.max(electoresHab - totalAsistentes, 0)
  const participacion = electoresHab ? (totalAsistentes / electoresHab) * 100 : 0

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">
            Mesa {ctx.table.number}
            {ctx.table.code ? ` · ${ctx.table.code}` : ''} · {ctx.table.school_name}
          </h2>
          <p className="text-sm text-ink-500">
            {ctx.table.district} / {ctx.table.province}
          </p>
        </div>
        <StatusBadge status={ctx.record ? ctx.record.status : 'SIN_DATOS'} />
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <label className={labelClass}>
          Electores habilitados
          <input
            type="number"
            min={0}
            className={inputClass}
            value={electoresHab}
            onChange={(e) => setElectoresHab(Number(e.target.value))}
          />
        </label>
        <label className={labelClass}>
          Total asistentes
          <input
            type="number"
            min={0}
            className={inputClass}
            value={totalAsistentes}
            onChange={(e) => setTotalAsistentes(Number(e.target.value))}
          />
        </label>
        <Metric label="Ausentismo" value={String(ausentismo)} />
        <Metric label="Participacion" value={`${participacion.toFixed(1)}%`} />
      </div>

      <div className="flex flex-col gap-4">
        {CATEGORIES.map((cat) => {
          const g = grid[cat]
          const total = categoryTotals[cat] ?? 0
          const ok = total === totalAsistentes
          return (
            <section
              key={cat}
              className="overflow-hidden rounded-xl border border-ink-200 bg-white"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 bg-ink-50 px-4 py-2.5">
                <h3 className="text-sm font-semibold text-ink-800">{CATEGORY_LABELS[cat]}</h3>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700',
                  )}
                >
                  {ok ? 'Cuadra' : `Faltan ${totalAsistentes - total}`}
                </span>
              </div>

              <div className="divide-y divide-ink-100">
                {(ctx.table_parties[cat] ?? []).map((pid) => (
                  <div
                    key={`${cat}-${pid}`}
                    className="flex items-center justify-between gap-3 px-4 py-2"
                  >
                    <span className="truncate text-sm text-ink-700">
                      {partyById.get(pid) ?? `Partido ${pid}`}
                    </span>
                    <input
                      type="number"
                      min={0}
                      className={cn(inputClass, 'w-24 text-right')}
                      value={g.validos[pid] ?? 0}
                      onChange={(e) => setValido(cat, pid, Number(e.target.value))}
                    />
                  </div>
                ))}

                <div className="flex items-center justify-between gap-3 px-4 py-2">
                  <span className="text-sm text-ink-700">Votos nulos</span>
                  <input
                    type="number"
                    min={0}
                    className={cn(inputClass, 'w-24 text-right')}
                    value={g.nulos}
                    onChange={(e) => setNumber(cat, 'nulos', Number(e.target.value))}
                  />
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-2">
                  <span className="text-sm text-ink-700">Votos en blanco</span>
                  <input
                    type="number"
                    min={0}
                    className={cn(inputClass, 'w-24 text-right')}
                    value={g.blancos}
                    onChange={(e) => setNumber(cat, 'blancos', Number(e.target.value))}
                  />
                </div>

                <div className="flex items-center justify-between gap-3 bg-ink-50 px-4 py-2">
                  <span className="text-sm font-semibold text-ink-700">Total categoria</span>
                  <span className={cn('text-sm font-bold', ok ? 'text-emerald-600' : 'text-red-600')}>
                    {total} / {totalAsistentes}
                  </span>
                </div>
              </div>
            </section>
          )
        })}
      </div>

      <label className={labelClass}>
        Comentario / Observaciones (opcional)
        <textarea
          className={cn(inputClass, 'min-h-20 resize-y')}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Ej: se encontro un acta con enmendaduras..."
        />
      </label>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {saved && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {saved}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="button" className={btnPrimary} onClick={save} disabled={saving || !allBalanced}>
          {saving ? 'Guardando...' : ctx.record ? 'Guardar cambios' : 'Registrar votos'}
        </button>
        <button type="button" className={btnSecondary} onClick={load}>
          Recargar
        </button>
        {!allBalanced && (
          <span className="self-center text-xs text-red-600">
            Ajuste los votos hasta que cada categoria cuadre con los asistentes.
          </span>
        )}
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink-200 bg-white px-3 py-2">
      <span className="block text-xs text-ink-500">{label}</span>
      <strong className="text-base text-ink-900">{value}</strong>
    </div>
  )
}
