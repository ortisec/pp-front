import { useCallback, useEffect, useState } from 'react'
import { ApiError, api } from '../../api/client'
import type { District, ProcessItem, Province, School } from '../../api/adminTypes'
import { Modal } from '../../components/Modal'
import { btnPrimary, btnSecondary, inputClass, labelClass } from '../../ui/styles'

interface Props {
  process: ProcessItem | null
  onNotify: (msg: string, kind?: 'ok' | 'error') => void
}

const EMPTY = { local_id: '', name: '', address: '', district_id: '' }

export function SchoolsPanel({ process, onNotify }: Props) {
  const [schools, setSchools] = useState<School[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [provinces, setProvinces] = useState<Province[]>([])
  const [filterDistrict, setFilterDistrict] = useState<number | ''>('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<School | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!process) return
    try {
      setSchools(await api.get<School[]>(`/admin/schools?process_id=${process.id}`))
      setDistricts(await api.get<District[]>(`/admin/districts?process_id=${process.id}`))
      setProvinces(await api.get<Province[]>(`/admin/provinces?process_id=${process.id}`))
    } catch {
      onNotify('No se pudieron cargar los locales.', 'error')
    }
  }, [process, onNotify])

  useEffect(() => {
    void load()
  }, [load])

  const districtName = (id: number) => districts.find((d) => d.id === id)?.name ?? `#${id}`
  const provinceName = (districtId: number) => {
    const d = districts.find((x) => x.id === districtId)
    return d ? provinces.find((p) => p.id === d.province_id)?.name ?? '' : ''
  }

  const visible = filterDistrict
    ? schools.filter((s) => s.district_id === filterDistrict)
    : schools

  function openCreate() {
    setEditing(null)
    setForm({ ...EMPTY, district_id: filterDistrict ? String(filterDistrict) : '' })
    setModalOpen(true)
  }

  function openEdit(s: School) {
    setEditing(s)
    setForm({
      local_id: s.local_id,
      name: s.name,
      address: s.address ?? '',
      district_id: String(s.district_id),
    })
    setModalOpen(true)
  }

  async function save() {
    if (!process || !form.name.trim() || !form.district_id) return
    setSaving(true)
    try {
      const body = {
        local_id: form.local_id.trim() || `LOC-${Date.now()}`,
        name: form.name.trim(),
        address: form.address.trim() || null,
        district_id: Number(form.district_id),
      }
      if (editing) {
        const updated = await api.patch<School>(`/admin/schools/${editing.id}`, body)
        setSchools((prev) => prev.map((s) => (s.id === updated.id ? updated : s)))
        onNotify('Local actualizado.')
      } else {
        const created = await api.post<School>('/admin/schools', { process_id: process.id, ...body })
        setSchools((prev) => [...prev, created])
        onNotify('Local creado.')
      }
      setModalOpen(false)
    } catch (err) {
      onNotify(err instanceof ApiError ? String(err.detail) : 'No se pudo guardar.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function remove(s: School) {
    if (!confirm(`Eliminar el local "${s.name}" y sus mesas?`)) return
    try {
      await api.del(`/admin/schools/${s.id}`)
      setSchools((prev) => prev.filter((x) => x.id !== s.id))
      onNotify('Local eliminado.')
    } catch {
      onNotify('No se pudo eliminar el local.', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-ink-500">
          Distrito:
          <select
            className={inputClass + ' w-auto'}
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">Todos</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        <button className={btnPrimary} onClick={openCreate} disabled={!process || !districts.length}>
          + Nuevo local
        </button>
      </div>

      {!districts.length && process && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Primero cree provincias y distritos en la pestana Geografia.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((s) => (
          <article key={s.id} className="flex flex-col rounded-xl border border-ink-200 bg-white p-4 transition hover:shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-semibold text-ink-900">{s.name}</h4>
                <p className="text-xs text-ink-400">{s.local_id}</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-ink-600">
              {s.address || 'Sin direccion'}
            </p>
            <p className="mt-1 text-xs text-ink-500">
              {provinceName(s.district_id)} / {districtName(s.district_id)}
            </p>
            <div className="mt-3 flex gap-3 border-t border-ink-100 pt-3">
              <button className="text-xs font-medium text-brand-600 hover:underline" onClick={() => openEdit(s)}>
                Editar
              </button>
              <button className="text-xs font-medium text-red-600 hover:underline" onClick={() => remove(s)}>
                Eliminar
              </button>
            </div>
          </article>
        ))}
        {!visible.length && (
          <p className="col-span-full rounded-xl border border-dashed border-ink-200 py-10 text-center text-sm text-ink-400">
            No hay locales registrados.
          </p>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editing ? 'Editar local' : 'Nuevo local'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className={btnSecondary} onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button
              className={btnPrimary}
              onClick={save}
              disabled={saving || !form.name.trim() || !form.district_id}
            >
              Guardar
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <label className={labelClass}>
            Nombre del centro educativo
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              autoFocus
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={labelClass}>
              Codigo de local (opcional)
              <input
                className={inputClass}
                value={form.local_id}
                onChange={(e) => setForm({ ...form, local_id: e.target.value })}
                placeholder="LOC-0001"
              />
            </label>
            <label className={labelClass}>
              Distrito
              <select
                className={inputClass}
                value={form.district_id}
                onChange={(e) => setForm({ ...form, district_id: e.target.value })}
              >
                <option value="">Seleccione...</option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className={labelClass}>
            Direccion (opcional)
            <input
              className={inputClass}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </label>
        </div>
      </Modal>
    </div>
  )
}
