import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../api/client'
import type { ProcessItem } from '../api/adminTypes'
import { GeographyPanel } from './admin/GeographyPanel'
import { PartiesPanel } from './admin/PartiesPanel'
import { SchoolsPanel } from './admin/SchoolsPanel'
import { TablesPanel } from './admin/TablesPanel'
import { UsersPanel } from './admin/UsersPanel'
import { Modal } from '../components/Modal'
import { btnPrimary, btnSecondary, cn, inputClass, labelClass } from '../ui/styles'

const CURRENT_YEAR = new Date().getFullYear()

type Section = 'partidos' | 'geografia' | 'locales' | 'mesas' | 'usuarios'

const SECTIONS: { id: Section; label: string }[] = [
  { id: 'partidos', label: 'Partidos' },
  { id: 'geografia', label: 'Geografia' },
  { id: 'locales', label: 'Locales' },
  { id: 'mesas', label: 'Mesas' },
  { id: 'usuarios', label: 'Usuarios' },
]

export function AdminPage() {
  const [processes, setProcesses] = useState<ProcessItem[]>([])
  const [process, setProcess] = useState<ProcessItem | null>(null)
  const [section, setSection] = useState<Section>('partidos')
  const [toast, setToast] = useState<{ msg: string; kind: 'ok' | 'error' } | null>(null)
  const [processModal, setProcessModal] = useState(false)
  const [pform, setPform] = useState({ name: '', year: String(CURRENT_YEAR), process_type: 'REGIONAL' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get<ProcessItem[]>('/admin/processes').then((data) => {
      setProcesses(data)
      if (data.length) setProcess(data[0])
    })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  function notify(msg: string, kind: 'ok' | 'error' = 'ok') {
    setToast({ msg, kind })
  }

  async function createProcess(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const created = await api.post<ProcessItem>('/admin/processes', {
        name: pform.name.trim(),
        year: Number(pform.year),
        process_type: pform.process_type,
        is_active: true,
      })
      setProcesses((prev) => [created, ...prev])
      setProcess(created)
      setProcessModal(false)
      notify('Proceso creado.')
    } catch (err) {
      notify(err instanceof Error ? err.message : 'No se pudo crear el proceso.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function deleteProcess(p: ProcessItem) {
    if (
      !confirm(
        `Eliminar el proceso "${p.name}"? Se borraran sus provincias, distritos, locales, mesas, partidos y votos asociados.`,
      )
    )
      return
    try {
      await api.del(`/admin/processes/${p.id}`)
      const remaining = processes.filter((x) => x.id !== p.id)
      setProcesses(remaining)
      setProcess(remaining[0] ?? null)
      notify('Proceso eliminado.')
    } catch {
      notify('No se pudo eliminar el proceso.', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink-900">Administracion</h2>
        <button className={btnSecondary} onClick={() => setProcessModal(true)}>
          + Nuevo proceso
        </button>
      </div>

      <section className="rounded-xl border border-ink-200 bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className={cn(labelClass, 'flex-1')}>
            Proceso electoral activo
            <select
              className={inputClass}
              value={process?.id ?? ''}
              onChange={(e) => {
                const found = processes.find((p) => p.id === Number(e.target.value))
                setProcess(found ?? null)
              }}
            >
              {!processes.length && <option value="">Sin procesos</option>}
              {processes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.year} · {p.process_type})
                </option>
              ))}
            </select>
          </label>
          {process && (
            <button
              type="button"
              className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
              onClick={() => void deleteProcess(process)}
            >
              Eliminar proceso
            </button>
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-1 rounded-lg border border-ink-200 bg-white p-1">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSection(s.id)}
            className={cn(
              'flex-1 rounded-md px-3 py-2 text-sm font-medium transition',
              section === s.id ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-100',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div>
        {section === 'partidos' && <PartiesPanel process={process} onNotify={notify} />}
        {section === 'geografia' && <GeographyPanel process={process} onNotify={notify} />}
        {section === 'locales' && <SchoolsPanel process={process} onNotify={notify} />}
        {section === 'mesas' && <TablesPanel process={process} onNotify={notify} />}
        {section === 'usuarios' && <UsersPanel process={process} onNotify={notify} />}
      </div>

      {toast && (
        <div
          className={cn(
            'fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg px-4 py-2.5 text-sm shadow-lg',
            toast.kind === 'ok' ? 'bg-ink-900 text-white' : 'bg-red-600 text-white',
          )}
        >
          {toast.msg}
        </div>
      )}

      <Modal
        open={processModal}
        title="Nuevo proceso electoral"
        onClose={() => setProcessModal(false)}
        footer={
          <>
            <button className={btnSecondary} onClick={() => setProcessModal(false)}>
              Cancelar
            </button>
            <button className={btnPrimary} onClick={createProcess} disabled={saving || !pform.name.trim()}>
              Crear
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <label className={labelClass}>
            Nombre
            <input
              className={inputClass}
              value={pform.name}
              onChange={(e) => setPform({ ...pform, name: e.target.value })}
              autoFocus
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              Anio
              <input
                type="number"
                className={inputClass}
                value={pform.year}
                onChange={(e) => setPform({ ...pform, year: e.target.value })}
              />
            </label>
            <label className={labelClass}>
              Tipo
              <select
                className={inputClass}
                value={pform.process_type}
                onChange={(e) => setPform({ ...pform, process_type: e.target.value })}
              >
                <option value="REGIONAL">Regional</option>
                <option value="MUNICIPAL">Municipal</option>
              </select>
            </label>
          </div>
        </div>
      </Modal>
    </div>
  )
}
