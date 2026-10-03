import { useCallback, useEffect, useState } from 'react'
import { ApiError, api } from '../../api/client'
import type { PollingTable, ProcessItem, School } from '../../api/adminTypes'
import { Modal } from '../../components/Modal'
import { btnPrimary, btnSecondary, cn, inputClass, labelClass } from '../../ui/styles'

interface Props {
  process: ProcessItem | null
  onNotify: (msg: string, kind?: 'ok' | 'error') => void
}

const EMPTY = { number: '', code: '', school_id: '', electores_habilitados: '0' }

export function TablesPanel({ process, onNotify }: Props) {
  const [tables, setTables] = useState<PollingTable[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [filterSchool, setFilterSchool] = useState<number | ''>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PollingTable | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!process) return
    try {
      setTables(await api.get<PollingTable[]>(`/admin/tables?process_id=${process.id}`))
      setSchools(await api.get<School[]>(`/admin/schools?process_id=${process.id}`))
    } catch {
      onNotify('No se pudieron cargar las mesas.', 'error')
    }
  }, [process, onNotify])

  useEffect(() => {
    void load()
  }, [load])

  const schoolName = (id: number) => schools.find((s) => s.id === id)?.name ?? `Local #${id}`
  const visible = filterSchool ? tables.filter((t) => t.school_id === filterSchool) : tables

  function openCreate() {
    setEditing(null)
    const firstSchool = filterSchool || (schools.length ? schools[0].id : '')
    setForm({ ...EMPTY, school_id: String(firstSchool) })
    setModalOpen(true)
  }

  function openEdit(t: PollingTable) {
    setEditing(t)
    setForm({
      number: String(t.number),
      code: t.code ?? '',
      school_id: String(t.school_id),
      electores_habilitados: String(t.electores_habilitados),
    })
    setModalOpen(true)
  }

  async function save() {
    if (!process || form.number === '' || !form.school_id) return
    setSaving(true)
    try {
      const body = {
        number: Number(form.number),
        code: form.code.trim() || null,
        school_id: Number(form.school_id),
        electores_habilitados: Number(form.electores_habilitados) || 0,
      }
      if (editing) {
        const updated = await api.patch<PollingTable>(`/admin/tables/${editing.id}`, body)
        setTables((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
        onNotify('Mesa actualizada.')
      } else {
        const created = await api.post<PollingTable>('/admin/tables', {
          process_id: process.id,
          ...body,
        })
        setTables((prev) => [...prev, created])
        onNotify('Mesa creada.')
      }
      setModalOpen(false)
    } catch (err) {
      onNotify(err instanceof ApiError ? String(err.detail) : 'No se pudo guardar.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function remove(t: PollingTable) {
    if (!confirm(`Eliminar la mesa ${t.number}?`)) return
    try {
      await api.del(`/admin/tables/${t.id}`)
      setTables((prev) => prev.filter((x) => x.id !== t.id))
      onNotify('Mesa eliminada.')
    } catch {
      onNotify('No se pudo eliminar la mesa.', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-500">
          Local:
          <select
            className={cn(inputClass, 'w-auto')}
            value={filterSchool}
            onChange={(e) => setFilterSchool(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Todos</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <button className={btnPrimary} onClick={openCreate} disabled={!process || !schools.length}>
          + Nueva mesa
        </button>
      </div>

      {!schools.length && process && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Primero cree locales en la pestana Locales.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Mesa</th>
              <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Codigo</th>
              <th className="px-4 py-2.5 font-medium">Local</th>
              <th className="hidden px-4 py-2.5 font-medium md:table-cell">Electores</th>
              <th className="px-4 py-2.5 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {visible.map((t) => (
              <tr key={t.id} className="transition hover:bg-ink-50">
                <td className="px-4 py-2.5 font-semibold text-ink-800">{t.number}</td>
                <td className="hidden px-4 py-2.5 text-ink-500 sm:table-cell">{t.code ?? '-'}</td>
                <td className="px-4 py-2.5 text-ink-700">{schoolName(t.school_id)}</td>
                <td className="hidden px-4 py-2.5 text-ink-500 md:table-cell">{t.electores_habilitados}</td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-2">
                    <button className="text-xs font-medium text-brand-600 hover:underline" onClick={() => openEdit(t)}>
                      Editar
                    </button>
                    <button className="text-xs font-medium text-red-600 hover:underline" onClick={() => remove(t)}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!visible.length && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink-400">
                  No hay mesas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? 'Editar mesa' : 'Nueva mesa'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className={btnSecondary} onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button className={btnPrimary} onClick={save} disabled={saving || form.number === '' || !form.school_id}>
              Guardar
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              Numero de mesa
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                autoFocus
              />
            </label>
            <label className={labelClass}>
              Codigo (opcional)
              <input
                className={inputClass}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="Ej: 020101"
              />
            </label>
          </div>
          <label className={labelClass}>
            Local / centro educativo
            <select
              className={inputClass}
              value={form.school_id}
              onChange={(e) => setForm({ ...form, school_id: e.target.value })}
            >
              <option value="">Seleccione...</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Electores habilitados
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.electores_habilitados}
              onChange={(e) => setForm({ ...form, electores_habilitados: e.target.value })}
            />
          </label>
        </div>
      </Modal>
    </div>
  )
}
