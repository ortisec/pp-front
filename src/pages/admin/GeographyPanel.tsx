import { useCallback, useEffect, useState } from 'react'
import { ApiError, api } from '../../api/client'
import type { District, ProcessItem, Province } from '../../api/adminTypes'
import { Modal } from '../../components/Modal'
import { btnPrimary, btnSecondary, cn, inputClass, labelClass } from '../../ui/styles'

interface Props {
  process: ProcessItem | null
  onNotify: (msg: string, kind?: 'ok' | 'error') => void
}

export function GeographyPanel({ process, onNotify }: Props) {
  const [provinces, setProvinces] = useState<Province[]>([])
  const [districts, setDistricts] = useState<District[]>([])
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null)

  const [provinceModal, setProvinceModal] = useState(false)
  const [editingProvince, setEditingProvince] = useState<Province | null>(null)
  const [provinceForm, setProvinceForm] = useState({ name: '', ubigeo: '' })

  const [districtModal, setDistrictModal] = useState(false)
  const [editingDistrict, setEditingDistrict] = useState<District | null>(null)
  const [districtForm, setDistrictForm] = useState({ name: '', ubigeo: '' })

  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!process) return
    try {
      const provs = await api.get<Province[]>(`/admin/provinces?process_id=${process.id}`)
      setProvinces(provs)
      const dists = await api.get<District[]>(`/admin/districts?process_id=${process.id}`)
      setDistricts(dists)
      if (!selectedProvince && provs.length) setSelectedProvince(provs[0].id)
    } catch {
      onNotify('No se pudo cargar la geografia.', 'error')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [process, onNotify])

  useEffect(() => {
    void load()
  }, [load])

  const visibleDistricts = selectedProvince
    ? districts.filter((d) => d.province_id === selectedProvince)
    : districts

  async function saveProvince() {
    if (!process || !provinceForm.name.trim()) return
    setSaving(true)
    try {
      if (editingProvince) {
        const updated = await api.patch<Province>(`/admin/provinces/${editingProvince.id}`, provinceForm)
        setProvinces((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
        onNotify('Provincia actualizada.')
      } else {
        const created = await api.post<Province>('/admin/provinces', {
          process_id: process.id,
          ...provinceForm,
        })
        setProvinces((prev) => [...prev, created])
        setSelectedProvince(created.id)
        onNotify('Provincia creada.')
      }
      setProvinceModal(false)
    } catch (err) {
      onNotify(err instanceof ApiError ? String(err.detail) : 'No se pudo guardar.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function removeProvince(p: Province) {
    if (!confirm(`Eliminar la provincia "${p.name}" y todos sus distritos/locales?`)) return
    try {
      await api.del(`/admin/provinces/${p.id}`)
      setProvinces((prev) => prev.filter((x) => x.id !== p.id))
      setDistricts((prev) => prev.filter((d) => d.province_id !== p.id))
      onNotify('Provincia eliminada.')
    } catch {
      onNotify('No se pudo eliminar la provincia.', 'error')
    }
  }

  async function saveDistrict() {
    if (!process || !selectedProvince || !districtForm.name.trim()) return
    setSaving(true)
    try {
      if (editingDistrict) {
        const updated = await api.patch<District>(`/admin/districts/${editingDistrict.id}`, districtForm)
        setDistricts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
        onNotify('Distrito actualizado.')
      } else {
        const created = await api.post<District>('/admin/districts', {
          process_id: process.id,
          province_id: selectedProvince,
          ...districtForm,
        })
        setDistricts((prev) => [...prev, created])
        onNotify('Distrito creado.')
      }
      setDistrictModal(false)
    } catch (err) {
      onNotify(err instanceof ApiError ? String(err.detail) : 'No se pudo guardar.', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function removeDistrict(d: District) {
    if (!confirm(`Eliminar el distrito "${d.name}"?`)) return
    try {
      await api.del(`/admin/districts/${d.id}`)
      setDistricts((prev) => prev.filter((x) => x.id !== d.id))
      onNotify('Distrito eliminado.')
    } catch {
      onNotify('No se pudo eliminar el distrito.', 'error')
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <section className="rounded-xl border border-ink-200 bg-white">
        <header className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-ink-800">Provincias</h3>
          <button
            className="text-xs font-medium text-brand-600 hover:underline"
            onClick={() => {
              setEditingProvince(null)
              setProvinceForm({ name: '', ubigeo: '' })
              setProvinceModal(true)
            }}
            disabled={!process}
          >
            + Agregar
          </button>
        </header>
        <ul className="divide-y divide-ink-100">
          {provinces.map((p) => (
            <li
              key={p.id}
              className={cn(
                'flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm transition',
                selectedProvince === p.id ? 'bg-brand-50' : 'hover:bg-ink-50',
              )}
              onClick={() => setSelectedProvince(p.id)}
            >
              <span className={cn('font-medium', selectedProvince === p.id ? 'text-brand-700' : 'text-ink-700')}>
                {p.name}
                <span className="ml-2 text-xs text-ink-400">{p.ubigeo}</span>
              </span>
              <span className="flex gap-2">
                <button
                  className="text-xs text-brand-600 hover:underline"
                  onClick={(e) => {
                    e.stopPropagation()
                    setEditingProvince(p)
                    setProvinceForm({ name: p.name, ubigeo: p.ubigeo })
                    setProvinceModal(true)
                  }}
                >
                  Editar
                </button>
                <button
                  className="text-xs text-red-600 hover:underline"
                  onClick={(e) => {
                    e.stopPropagation()
                    void removeProvince(p)
                  }}
                >
                  X
                </button>
              </span>
            </li>
          ))}
          {!provinces.length && <li className="px-4 py-6 text-center text-sm text-ink-400">Sin provincias.</li>}
        </ul>
      </section>

      <section className="rounded-xl border border-ink-200 bg-white">
        <header className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-ink-800">
            Distritos {selectedProvince ? `de ${provinces.find((p) => p.id === selectedProvince)?.name}` : ''}
          </h3>
          <button
            className="text-xs font-medium text-brand-600 hover:underline"
            onClick={() => {
              setEditingDistrict(null)
              setDistrictForm({ name: '', ubigeo: '' })
              setDistrictModal(true)
            }}
            disabled={!selectedProvince}
          >
            + Agregar distrito
          </button>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Distrito</th>
                <th className="px-4 py-2.5 font-medium">Ubigeo</th>
                <th className="px-4 py-2.5 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {visibleDistricts.map((d) => (
                <tr key={d.id} className="transition hover:bg-ink-50">
                  <td className="px-4 py-2.5 font-medium text-ink-800">{d.name}</td>
                  <td className="px-4 py-2.5 text-ink-500">{d.ubigeo}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-2">
                      <button
                        className="text-xs font-medium text-brand-600 hover:underline"
                        onClick={() => {
                          setEditingDistrict(d)
                          setDistrictForm({ name: d.name, ubigeo: d.ubigeo })
                          setDistrictModal(true)
                        }}
                      >
                        Editar
                      </button>
                      <button className="text-xs font-medium text-red-600 hover:underline" onClick={() => removeDistrict(d)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!visibleDistricts.length && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-ink-400">
                    No hay distritos. {selectedProvince ? 'Agregue uno.' : 'Elija una provincia.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={provinceModal}
        title={editingProvince ? 'Editar provincia' : 'Nueva provincia'}
        onClose={() => setProvinceModal(false)}
        footer={
          <>
            <button className={btnSecondary} onClick={() => setProvinceModal(false)}>
              Cancelar
            </button>
            <button className={btnPrimary} onClick={saveProvince} disabled={saving || !provinceForm.name.trim()}>
              Guardar
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <label className={labelClass}>
            Nombre
            <input
              className={inputClass}
              value={provinceForm.name}
              onChange={(e) => setProvinceForm({ ...provinceForm, name: e.target.value })}
              autoFocus
            />
          </label>
          <label className={labelClass}>
            Ubigeo (6 digitos)
            <input
              className={inputClass}
              maxLength={6}
              value={provinceForm.ubigeo}
              onChange={(e) => setProvinceForm({ ...provinceForm, ubigeo: e.target.value.replace(/\D/g, '') })}
            />
          </label>
        </div>
      </Modal>

      <Modal
        open={districtModal}
        title={editingDistrict ? 'Editar distrito' : 'Nuevo distrito'}
        onClose={() => setDistrictModal(false)}
        footer={
          <>
            <button className={btnSecondary} onClick={() => setDistrictModal(false)}>
              Cancelar
            </button>
            <button className={btnPrimary} onClick={saveDistrict} disabled={saving || !districtForm.name.trim()}>
              Guardar
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <label className={labelClass}>
            Nombre
            <input
              className={inputClass}
              value={districtForm.name}
              onChange={(e) => setDistrictForm({ ...districtForm, name: e.target.value })}
              autoFocus
            />
          </label>
          <label className={labelClass}>
            Ubigeo (6 digitos)
            <input
              className={inputClass}
              maxLength={6}
              value={districtForm.ubigeo}
              onChange={(e) => setDistrictForm({ ...districtForm, ubigeo: e.target.value.replace(/\D/g, '') })}
            />
          </label>
        </div>
      </Modal>
    </div>
  )
}
