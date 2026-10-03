import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError, api } from '../../api/client'
import type {
  DniLookupResult,
  PollingTable,
  ProcessItem,
  School,
  UserAccount,
  UserRole,
} from '../../api/adminTypes'
import { Modal } from '../../components/Modal'
import { btnPrimary, btnSecondary, cn, inputClass, labelClass } from '../../ui/styles'

interface Props {
  process: ProcessItem | null
  onNotify: (msg: string, kind?: 'ok' | 'error') => void
}

interface FormState {
  full_name: string
  dni: string
  phone: string
  role: Exclude<UserRole, 'ADMIN'>
  table_id: string
  school_id: string
}

const EMPTY: FormState = {
  full_name: '',
  dni: '',
  phone: '',
  role: 'PERSONERO_MESA',
  table_id: '',
  school_id: '',
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  PERSONERO_MESA: 'Personero de mesa',
  PERSONERO_LOCAL: 'Personero de local',
}

export function UsersPanel({ process, onNotify }: Props) {
  const [users, setUsers] = useState<UserAccount[]>([])
  const [tables, setTables] = useState<PollingTable[]>([])
  const [schools, setSchools] = useState<School[]>([])
  const [filterRole, setFilterRole] = useState<UserRole | ''>('')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<UserAccount | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [lookingUp, setLookingUp] = useState(false)

  const load = useCallback(async () => {
    try {
      setUsers(await api.get<UserAccount[]>('/admin/users'))
    } catch {
      onNotify('No se pudieron cargar los usuarios.', 'error')
    }
    if (process) {
      try {
        setTables(await api.get<PollingTable[]>(`/admin/tables?process_id=${process.id}`))
        setSchools(await api.get<School[]>(`/admin/schools?process_id=${process.id}`))
      } catch {
        /* ignore */
      }
    }
  }, [process, onNotify])

  useEffect(() => {
    void load()
  }, [load])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return users.filter((u) => {
      if (filterRole && u.role !== filterRole) return false
      if (!term) return true
      return (
        u.full_name.toLowerCase().includes(term) ||
        (u.dni ?? '').includes(term) ||
        (u.phone ?? '').includes(term)
      )
    })
  }, [users, filterRole, search])

  const schoolName = (id: number | null) =>
    id ? schools.find((s) => s.id === id)?.name ?? `Local #${id}` : ''

  function assignmentLabel(u: UserAccount): string {
    const a = u.assignments[0]
    if (!a) return 'Sin asignacion'
    if (a.table_id) {
      const t = tables.find((x) => x.id === a.table_id)
      const label = t ? `Mesa ${t.number}${t.code ? ` (${t.code})` : ''}` : `Mesa #${a.table_id}`
      return t ? `${label} · ${schoolName(t.school_id)}` : label
    }
    if (a.school_id) return `Coordinador de ${schoolName(a.school_id)}`
    return 'Sin asignacion'
  }

  function openCreate() {
    setEditing(null)
    setForm({
      ...EMPTY,
      table_id: tables.length ? String(tables[0].id) : '',
      school_id: schools.length ? String(schools[0].id) : '',
    })
    setModalOpen(true)
  }

  function openEdit(u: UserAccount) {
    setEditing(u)
    const a = u.assignments[0]
    setForm({
      full_name: u.full_name,
      dni: u.dni ?? '',
      phone: u.phone ?? '',
      role: (u.role === 'ADMIN' ? 'PERSONERO_MESA' : u.role) as FormState['role'],
      table_id: a?.table_id ? String(a.table_id) : '',
      school_id: a?.school_id ? String(a.school_id) : '',
    })
    setModalOpen(true)
  }

  async function lookupDni() {
    if (form.dni.length !== 8) {
      onNotify('Ingrese un DNI de 8 digitos para consultar.', 'error')
      return
    }
    setLookingUp(true)
    try {
      const data = await api.get<DniLookupResult>(`/admin/dni/${form.dni}`)
      setForm((prev) => ({
        ...prev,
        full_name: data.full_name,
        dni: data.dni,
      }))
      onNotify(`Nombre encontrado: ${data.full_name}`)
    } catch (err) {
      onNotify(
        err instanceof ApiError && typeof err.detail === 'string'
          ? err.detail
          : 'No se pudo consultar el DNI.',
        'error',
      )
    } finally {
      setLookingUp(false)
    }
  }

  async function save() {
    if (!form.full_name.trim() || form.dni.length !== 8) return
    setSaving(true)
    try {
      const body = {
        full_name: form.full_name.trim(),
        dni: form.dni,
        phone: form.phone.trim() || null,
        role: form.role,
        table_id: form.role === 'PERSONERO_MESA' ? Number(form.table_id) || null : null,
        school_id: form.role === 'PERSONERO_LOCAL' ? Number(form.school_id) || null : null,
      }
      if (editing) {
        const updated = await api.patch<UserAccount>(`/admin/users/${editing.id}`, body)
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
        onNotify('Usuario actualizado.')
      } else {
        const created = await api.post<UserAccount>('/admin/users', body)
        setUsers((prev) => [...prev, created])
        onNotify('Usuario creado.')
      }
      setModalOpen(false)
    } catch (err) {
      onNotify(
        err instanceof ApiError && typeof err.detail === 'string'
          ? err.detail
          : 'No se pudo guardar el usuario.',
        'error',
      )
    } finally {
      setSaving(false)
    }
  }

  async function remove(u: UserAccount) {
    if (!confirm(`Eliminar al usuario "${u.full_name}"?`)) return
    try {
      await api.del(`/admin/users/${u.id}`)
      setUsers((prev) => prev.filter((x) => x.id !== u.id))
      onNotify('Usuario eliminado.')
    } catch (err) {
      onNotify(
        err instanceof ApiError && typeof err.detail === 'string'
          ? err.detail
          : 'No se pudo eliminar el usuario.',
        'error',
      )
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            className={cn(inputClass, 'w-48')}
            placeholder="Buscar nombre, DNI o celular"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className={cn(inputClass, 'w-auto')}
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as UserRole | '')}
          >
            <option value="">Todos los roles</option>
            <option value="PERSONERO_MESA">Personeros de mesa</option>
            <option value="PERSONERO_LOCAL">Personeros de local</option>
            <option value="ADMIN">Administradores</option>
          </select>
        </div>
        <button className={btnPrimary} onClick={openCreate} disabled={!process}>
          + Nuevo usuario
        </button>
      </div>

      {process && !tables.length && !schools.length && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Cree locales y mesas en las pestanas anteriores para poder asignar personeros.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Nombre</th>
              <th className="hidden px-4 py-2.5 font-medium sm:table-cell">DNI</th>
              <th className="hidden px-4 py-2.5 font-medium md:table-cell">Celular</th>
              <th className="px-4 py-2.5 font-medium">Rol</th>
              <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Asignacion</th>
              <th className="px-4 py-2.5 text-right font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {visible.map((u) => (
              <tr key={u.id} className="transition hover:bg-ink-50">
                <td className="px-4 py-2.5 font-medium text-ink-800">{u.full_name}</td>
                <td className="hidden px-4 py-2.5 text-ink-500 sm:table-cell">{u.dni ?? '-'}</td>
                <td className="hidden px-4 py-2.5 text-ink-500 md:table-cell">{u.phone ?? '-'}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={cn(
                      'inline-flex rounded-full border px-2 py-0.5 text-xs font-medium',
                      u.role === 'ADMIN'
                        ? 'border-brand-200 bg-brand-50 text-brand-700'
                        : 'border-ink-200 bg-ink-100 text-ink-600',
                    )}
                  >
                    {ROLE_LABELS[u.role]}
                  </span>
                </td>
                <td className="hidden px-4 py-2.5 text-ink-600 lg:table-cell">
                  {u.role === 'ADMIN' ? '-' : assignmentLabel(u)}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-2">
                    {u.role !== 'ADMIN' && (
                      <button
                        className="text-xs font-medium text-brand-600 hover:underline"
                        onClick={() => openEdit(u)}
                      >
                        Editar
                      </button>
                    )}
                    {u.role !== 'ADMIN' && (
                      <button
                        className="text-xs font-medium text-red-600 hover:underline"
                        onClick={() => remove(u)}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!visible.length && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink-400">
                  No hay usuarios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? 'Editar usuario' : 'Nuevo usuario'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className={btnSecondary} onClick={() => setModalOpen(false)}>
              Cancelar
            </button>
            <button
              className={btnPrimary}
              onClick={save}
              disabled={saving || !form.full_name.trim() || form.dni.length !== 8}
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <label className={labelClass}>
            DNI (usuario de acceso)
            <div className="flex gap-2">
              <input
                className={inputClass}
                maxLength={8}
                inputMode="numeric"
                value={form.dni}
                onChange={(e) => setForm({ ...form, dni: e.target.value.replace(/\D/g, '') })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && form.dni.length === 8) {
                    e.preventDefault()
                    void lookupDni()
                  }
                }}
                placeholder="12345678"
                autoFocus
              />
              <button
                type="button"
                onClick={() => void lookupDni()}
                disabled={lookingUp || form.dni.length !== 8}
                title="Buscar nombre por DNI"
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-ink-200 bg-white px-3 text-ink-600 transition hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {lookingUp ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-300 border-t-brand-600" />
                ) : (
                  <SearchIcon />
                )}
              </button>
            </div>
          </label>
          <label className={labelClass}>
            Nombre completo
            <input
              className={inputClass}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value.toUpperCase() })}
              placeholder="Se completa al consultar el DNI o puede escribirlo"
            />
          </label>
          <div className="grid grid-cols-1 gap-3">
            <label className={labelClass}>
              Celular
              <input
                className={inputClass}
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/[^\d+ ]/g, '') })}
                placeholder="987654321"
              />
            </label>
          </div>

          <label className={labelClass}>
            Rol
            <select
              className={inputClass}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as FormState['role'] })}
            >
              <option value="PERSONERO_MESA">Personero de mesa</option>
              <option value="PERSONERO_LOCAL">Personero de local (coordinador)</option>
            </select>
          </label>

          {form.role === 'PERSONERO_MESA' ? (
            <label className={labelClass}>
              Mesa de votacion asignada
              <select
                className={inputClass}
                value={form.table_id}
                onChange={(e) => setForm({ ...form, table_id: e.target.value })}
              >
                <option value="">Seleccione una mesa...</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Mesa {t.number}
                    {t.code ? ` (${t.code})` : ''} · {schoolName(t.school_id)}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className={labelClass}>
              Local / centro educativo (como coordinador)
              <select
                className={inputClass}
                value={form.school_id}
                onChange={(e) => setForm({ ...form, school_id: e.target.value })}
              >
                <option value="">Seleccione un local...</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <p className="text-xs text-ink-400">
            El personero iniciara sesion ingresando solo su DNI y podra registrar mesas dentro de su
            asignacion.
          </p>
        </div>
      </Modal>
    </div>
  )
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  )
}
