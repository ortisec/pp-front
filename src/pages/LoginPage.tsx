import { useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { btnPrimary, cn, inputClass, labelClass } from '../ui/styles'

type Tab = 'personero' | 'admin'

export function LoginPage() {
  const { loginDni, loginAdmin } = useAuth()
  const [tab, setTab] = useState<Tab>('personero')
  const [dni, setDni] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (tab === 'personero') await loginDni(dni.trim())
      else await loginAdmin(username.trim(), password)
    } catch (err) {
      setError(err instanceof ApiError ? String(err.detail) : 'No se pudo iniciar sesion')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-ink-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src="/LOGO-PODEMOS-PERU.png"
            alt="Podemos Peru"
            className="mb-3 h-16 w-auto object-contain"
          />
          <h1 className="text-xl font-semibold text-ink-900">Resultados Electorales</h1>
          <p className="mt-1 text-sm text-ink-500">Regionales y municipales del Peru</p>
        </div>

        <form
          onSubmit={submit}
          className="flex flex-col gap-4 rounded-2xl border border-ink-200 bg-white p-6 shadow-sm"
        >
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-ink-100 p-1">
            <TabButton active={tab === 'personero'} onClick={() => setTab('personero')}>
              Personero
            </TabButton>
            <TabButton active={tab === 'admin'} onClick={() => setTab('admin')}>
              Administrador
            </TabButton>
          </div>

          {tab === 'personero' ? (
            <label className={labelClass}>
              DNI
              <input
                className={inputClass}
                value={dni}
                onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                maxLength={8}
                inputMode="numeric"
                placeholder="12345678"
                autoFocus
                required
              />
            </label>
          ) : (
            <>
              <label className={labelClass}>
                Usuario
                <input
                  className={inputClass}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                  required
                />
              </label>
              <label className={labelClass}>
                Contrasena
                <input
                  className={inputClass}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
            </>
          )}

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button type="submit" className={btnPrimary} disabled={busy}>
            {busy ? 'Ingresando...' : 'Ingresar'}
          </button>

          <p className="text-center text-xs text-ink-400">
            Desarrollado por{' '}
            <a
              href="https://github.com/ortisec"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-600 hover:underline"
            >
              ortisec
            </a>
          </p>
        </form>
      </div>
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
        'rounded-md px-3 py-1.5 text-sm font-medium transition',
        active ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700',
      )}
    >
      {children}
    </button>
  )
}
