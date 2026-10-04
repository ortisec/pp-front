import { useEffect, useMemo, useRef, useState } from 'react'
import { api, openResultsSocket } from '../api/client'
import type {
  Analytics,
  Category,
  FiltersCatalog,
  RecordStatus,
  Summary,
  TableResult,
} from '../api/types'
import { CATEGORIES, CATEGORY_LABELS } from '../api/types'
import { StatusBadge } from '../components/StatusBadge'
import { BarList } from '../components/charts/BarList'
import { DonutChart } from '../components/charts/DonutChart'
import { VerticalBars } from '../components/charts/VerticalBars'
import { btnSecondary, cn, inputClass } from '../ui/styles'

type Tab = 'graficos' | 'detalle'

interface FilterState {
  provinceId: number | ''
  districtId: number | ''
  schoolId: number | ''
  status: RecordStatus | ''
  search: string
}

const EMPTY_FILTERS: FilterState = {
  provinceId: '',
  districtId: '',
  schoolId: '',
  status: '',
  search: '',
}

export function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [results, setResults] = useState<TableResult[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [catalog, setCatalog] = useState<FiltersCatalog | null>(null)
  const [processId, setProcessId] = useState<number | null>(null)
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('graficos')
  const [category, setCategory] = useState<Category>('PROVINCIA')
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    api
      .get<{ id: number }[]>('/admin/processes')
      .then((procs) => {
        if (procs.length) setProcessId(procs[0].id)
        else setError('No hay procesos electorales cargados.')
      })
      .catch(() => setError('No se pudieron cargar los procesos.'))
  }, [])

  useEffect(() => {
    if (!processId) return
    api
      .get<FiltersCatalog>(`/results/filters?process_id=${processId}`)
      .then(setCatalog)
      .catch(() => setCatalog(null))
  }, [processId])

  function buildQuery(): string {
    const params = new URLSearchParams({ process_id: String(processId) })
    if (filters.provinceId) params.set('province_id', String(filters.provinceId))
    if (filters.districtId) params.set('district_id', String(filters.districtId))
    if (filters.schoolId) params.set('school_id', String(filters.schoolId))
    if (filters.status) params.set('status', filters.status)
    return params.toString()
  }

  async function refresh() {
    if (!processId) return
    setError('')
    try {
      const q = buildQuery()
      const [sum, res, ana] = await Promise.all([
        api.get<Summary>(`/results/summary?${q}`),
        api.get<TableResult[]>(`/results/tables?${q}`),
        api.get<Analytics>(`/results/analytics?${q}`),
      ])
      setSummary(sum)
      setResults(res)
      setAnalytics(ana)
    } catch {
      setError('No se pudieron cargar los resultados con los filtros seleccionados.')
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processId, filters])

  useEffect(() => {
    if (!processId) return
    const ws = openResultsSocket()
    wsRef.current = ws
    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onmessage = () => void refresh()
    return () => ws.close()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processId])

  const districtsForProvince = useMemo(() => {
    if (!catalog) return []
    return filters.provinceId
      ? catalog.districts.filter((d) => d.province_id === filters.provinceId)
      : catalog.districts
  }, [catalog, filters.provinceId])

  const schoolsForDistrict = useMemo(() => {
    if (!catalog) return []
    return filters.districtId
      ? catalog.schools.filter((s) => s.district_id === filters.districtId)
      : catalog.schools
  }, [catalog, filters.districtId])

  const visibleResults = useMemo(() => {
    const term = filters.search.trim().toLowerCase()
    if (!term) return results
    return results.filter(
      (t) =>
        t.school_name.toLowerCase().includes(term) || String(t.table_number).includes(term),
    )
  }, [results, filters.search])

  const activeRanking = useMemo(
    () => analytics?.rankings.find((r) => r.category === category) ?? null,
    [analytics, category],
  )

  const distribution = useMemo(() => {
    if (!visibleResults.length) return []
    let validos = 0
    let nulos = 0
    let blancos = 0
    for (const table of visibleResults) {
      for (const cat of table.categories) {
        validos += cat.validos
        nulos += cat.nulos
        blancos += cat.blancos
      }
    }
    return [
      { label: 'Validos', value: validos, color: 'var(--color-brand-500)' },
      { label: 'Nulos', value: nulos, color: '#ef4444' },
      { label: 'Blancos', value: blancos, color: '#94a3b8' },
    ]
  }, [visibleResults])

  const totalDistribucion = distribution.reduce((a, s) => a + s.value, 0)
  const activeFilterCount =
    (filters.provinceId ? 1 : 0) +
    (filters.districtId ? 1 : 0) +
    (filters.schoolId ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.search ? 1 : 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink-900">Panel de resultados</h2>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
            connected
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-ink-200 bg-ink-100 text-ink-500',
          )}
        >
          <span className={cn('h-2 w-2 rounded-full', connected ? 'bg-emerald-500' : 'bg-ink-400')} />
          {connected ? 'Tiempo real' : 'Desconectado'}
        </span>
      </div>

      {error && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {error}
        </p>
      )}

      <section className="rounded-2xl border border-ink-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500">Filtros</h3>
          {activeFilterCount > 0 && (
            <button
              className="text-xs font-medium text-brand-600 hover:underline"
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
              Limpiar ({activeFilterCount})
            </button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="flex flex-col gap-1 text-xs font-medium text-ink-600">
            Provincia
            <select
              className={cn(inputClass, 'py-1.5')}
              value={filters.provinceId}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  provinceId: e.target.value ? Number(e.target.value) : '',
                  districtId: '',
                  schoolId: '',
                })
              }
            >
              <option value="">Todas</option>
              {catalog?.provinces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-ink-600">
            Distrito
            <select
              className={cn(inputClass, 'py-1.5')}
              value={filters.districtId}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  districtId: e.target.value ? Number(e.target.value) : '',
                  schoolId: '',
                })
              }
            >
              <option value="">Todos</option>
              {districtsForProvince.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-ink-600">
            Local / colegio
            <select
              className={cn(inputClass, 'py-1.5')}
              value={filters.schoolId}
              onChange={(e) =>
                setFilters({ ...filters, schoolId: e.target.value ? Number(e.target.value) : '' })
              }
            >
              <option value="">Todos</option>
              {schoolsForDistrict.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-ink-600">
            Estado del acta
            <select
              className={cn(inputClass, 'py-1.5')}
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as RecordStatus | '' })}
            >
              <option value="">Todos</option>
              <option value="CONFIRMADO">Confirmado</option>
              <option value="BORRADOR">Borrador</option>
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-medium text-ink-600">
            Buscar mesa / colegio
            <input
              className={cn(inputClass, 'py-1.5')}
              placeholder="Ej: 150122-01"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </label>
        </div>
      </section>

      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Metric title="Mesas reportadas" value={`${summary.tables_reportadas}/${summary.total_tables}`} />
          <Metric title="Asistentes" value={summary.total_asistentes.toLocaleString()} />
          <Metric title="Ausentismo" value={summary.ausentismo.toLocaleString()} />
          <Metric title="Participacion" value={`${summary.participation}%`} />
          <Metric title="Observaciones" value={String(summary.comment_count)} />
        </div>
      )}

      <div className="flex gap-1 rounded-lg border border-ink-200 bg-white p-1">
        <TabButton active={tab === 'graficos'} onClick={() => setTab('graficos')}>
          Graficos
        </TabButton>
        <TabButton active={tab === 'detalle'} onClick={() => setTab('detalle')}>
          Detalle por mesa
        </TabButton>
      </div>

      {tab === 'graficos' && analytics && (
        <div className="flex flex-col gap-5">
          <section className="rounded-2xl border border-ink-200 bg-white p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-ink-800">Ranking de partidos</h3>
              <select
                className="rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-700"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </select>
            </div>
            {activeRanking && activeRanking.ranking.length ? (
              <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
                <BarList
                  items={activeRanking.ranking.map((r) => ({
                    label: `#${r.position} ${r.party_name}`,
                    value: r.votes,
                    secondary: `${r.percentage}% de votos validos`,
                    color: r.color,
                  }))}
                  unit="votos"
                />
                <div className="flex items-center justify-center">
                  <DonutChart
                    segments={activeRanking.ranking.slice(0, 6).map((r, i) => ({
                      label: r.party_name,
                      value: r.votes,
                      color: r.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                    }))}
                    centerValue={activeRanking.total_validos.toLocaleString()}
                    centerLabel="validos"
                  />
                </div>
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-ink-400">
                Aun no hay votos validos registrados en esta categoria.
              </p>
            )}
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-ink-200 bg-white p-4 sm:p-5">
              <h3 className="mb-4 text-sm font-semibold text-ink-800">
                Colegios con mas votos validos
              </h3>
              <BarList
                items={analytics.school_ranking.slice(0, 8).map((s) => ({
                  label: s.school_name,
                  value: s.validos,
                  secondary: `${s.district_name} · participacion ${s.participation}%`,
                  color: 'var(--color-brand-500)',
                }))}
                unit="votos"
              />
            </section>

            <section className="rounded-2xl border border-ink-200 bg-white p-4 sm:p-5">
              <h3 className="mb-4 text-sm font-semibold text-ink-800">Participacion por distrito</h3>
              <VerticalBars
                data={analytics.district_participation.slice(0, 10).map((d) => ({
                  label: d.district_name,
                  value: d.participation,
                  hint: `${d.asistentes}/${d.electores} electores`,
                }))}
              />
            </section>
          </div>

          <section className="rounded-2xl border border-ink-200 bg-white p-4 sm:p-5">
            <h3 className="mb-4 text-sm font-semibold text-ink-800">
              Distribucion de votos (todas las categorias)
            </h3>
            <DonutChart
              segments={distribution}
              centerValue={totalDistribucion.toLocaleString()}
              centerLabel="votos"
              size={180}
            />
          </section>
        </div>
      )}

      {tab === 'detalle' && (
        <div className="flex flex-col gap-4">
          {visibleResults.map((table) => (
            <div key={table.table_id} className="rounded-2xl border border-ink-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong className="text-sm text-ink-900">
                  Mesa {table.table_number} · {table.school_name}
                </strong>
                <StatusBadge status={table.status ?? 'SIN_DATOS'} />
              </div>
              <p className="mt-1 text-xs text-ink-500">
                Asistentes {table.total_asistentes} · Ausentismo {table.ausentismo} · Participacion{' '}
                {table.participation}%
              </p>
              {table.comment && (
                <p className="mt-1 text-xs text-amber-700">Observacion: {table.comment}</p>
              )}

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {table.categories.map((cat) => (
                  <div key={cat.category} className="rounded-xl bg-ink-50 p-3">
                    <h4 className="text-xs font-semibold text-ink-700">{CATEGORY_LABELS[cat.category]}</h4>
                    <p className="mt-0.5 text-xs text-ink-500">
                      Validos {cat.validos} · Nulos {cat.nulos} · Blancos {cat.blancos}
                    </p>
                    <ul className="mt-2 flex flex-col gap-1">
                      {cat.parties.map((p) => (
                        <li key={p.party_id} className="flex items-center gap-2 text-sm text-ink-700">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ background: p.color ?? '#8591a6' }}
                          />
                          <span className="truncate">{p.party_name}</span>
                          <strong className="ml-auto whitespace-nowrap text-ink-900">
                            {p.votes} ({p.percentage}%)
                          </strong>
                        </li>
                      ))}
                      {!cat.parties.length && <li className="text-xs text-ink-400">Sin validos.</li>}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!visibleResults.length && (
            <p className="rounded-xl border border-dashed border-ink-200 py-10 text-center text-sm text-ink-400">
              No hay mesas con los filtros seleccionados.
            </p>
          )}
          <div className="flex justify-end">
            <button className={btnSecondary} onClick={() => void refresh()}>
              Recargar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const FALLBACK_COLORS = ['#2f6fed', '#ef4444', '#16a34a', '#f59e0b', '#8b5cf6', '#0891b2', '#ec4899']

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white px-4 py-3">
      <span className="block text-xs text-ink-500">{title}</span>
      <strong className="text-xl text-ink-900">{value}</strong>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 rounded-md px-3 py-2 text-sm font-medium transition',
        active ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100',
      )}
    >
      {children}
    </button>
  )
}
