import { useCallback, useEffect, useState } from 'react'
import { ApiError, api } from '../../api/client'
import type { Party, ProcessItem } from '../../api/adminTypes'
import { Modal } from '../../components/Modal'
import { btnPrimary, btnSecondary, cn, inputClass, labelClass } from '../../ui/styles'

interface Props {
  process: ProcessItem | null
  onNotify: (msg: string, kind?: 'ok' | 'error') => void
}

const EMPTY = { name: '', code: '', color: '#2f6fed' }

export function PartiesPanel({ process, onNotify }: Props) {
  const [parties, setParties] = useState<Party[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Party | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!process) return
    setLoading(true)
    try {
      setParties(await api.get<Party[]>(`/admin/parties?process_id=${process.id}`))
    } catch {
      onNotify('No se pudieron cargar los partidos.', 'error')
    } finally {
      setLoading(false)
    }
  }, [process, onNotify])

  useEffect(() => {
    void load()
  }, [load])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setModalOpen(true)
  }

  function openEdit(p: Party) {
    setEditing(p)
    setForm({ name: p.name, code: p.code ?? '', color: p.color ?? '#2f6fed' })
    setModalOpen(true)
  }

  async function save() {
    if (!process || !form.name.trim()) return
    setSaving(true)
    try {
      const body = {
        name: form.name.trim(),
        code: form.code.trim() || null,
        color: form.color || null,
      }
      if (editing) {
        const updated = await api.patch<Party>(`/admin/parties/${editing.id}`, body)
        setParties((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        onNotify('Partido actualizado.')
      } else {
        const created = await api.post<Party>('/admin/parties', { process_id: process.id, ...body })
        setParties((prev) => [...prev, created])
        onNotify('Partido creado.')
      }
      setModalOpen(false)
    } catch (err) {
      onNotify(err instanceof ApiError ? String(err.detail) : 'No se pudo guardar.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function remove(p: Party) {
    if (!confirm(`Eliminar el partido "${p.name}"? Se borraran sus candidaturas asociadas.`)) return
    try {
      await api.del(`/admin/parties/${p.id}`)
      setParties((prev) => prev.filter((x) => x.id !== p.id))
      onNotify('Partido eliminado.')
    } catch {
      onNotify('No se pudo eliminar el partido.', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-500">
          {process ? `${parties.length} partido(s) en ${process.name}` : 'Seleccione un proceso'}
        </p>
        <button className={btnPrimary} onClick={openCreate} disabled={!process}>
          + Nuevo partido
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Partido</th>
              <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Codigo</th>
              <th className="px-4 py-2.5 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {parties.map((p) => (
              <tr key={p.id} className="transition hover:bg-ink-50">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ background: p.color ?? '#8591a6' }}
                    />
                    <span className="font-medium text-ink-800">{p.name}</span>
                  </div>
                </td>
                <td className="hidden px-4 py-2.5 text-ink-500 sm:table-cell">{p.code ?? '-'}</td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-2">
                    <button className="text-xs font-medium text-brand-600 hover:underline" onClick={() => openEdit(p)}>
                      Editar
                    </button>
                    <button className="text-xs font-medium text-red-600 hover:underline" onClick={() => remove(p)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!parties.length && !loading && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-ink-400">
                  No hay partidos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? 'Editar partido' : 'Nuevo partido'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className={btnSecondary} onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className={btnPrimary} onClick={save} disabled={saving || !form.name.trim()}>
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <label className={labelClass}>
            Nombre del partido
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              Codigo (opcional)
              <input
                className={inputClass}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </label>
            <label className={labelClass}>
              Color
              <input
                type="color"
                className={cn(inputClass, 'h-10 p-1')}
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
              />
            </label>
          </div>
        </div>
      </Modal>
    </div>
  )
}
