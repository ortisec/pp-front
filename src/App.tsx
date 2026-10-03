import { useState } from 'react'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { AdminPage } from './pages/AdminPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { PersoneroLocalPage } from './pages/PersoneroLocalPage'
import { PersoneroMesaPage } from './pages/PersoneroMesaPage'
import { btnSecondary, cn } from './ui/styles'

type Tab = 'registro' | 'dashboard' | 'admin'

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  PERSONERO_MESA: 'Personero de mesa',
  PERSONERO_LOCAL: 'Personero de local',
}

function Shell() {
  const { user, loading, logout } = useAuth()
  const [tab, setTab] = useState<Tab>('registro')

  if (loading)
    return (
      <div className="flex min-h-full items-center justify-center text-sm text-ink-500">
        Cargando...
      </div>
    )
  if (!user) return <LoginPage />

  const isAdmin = user.role === 'ADMIN'
  const isLocal = user.role === 'PERSONERO_LOCAL'

  let content
  if (tab === 'dashboard') content = <DashboardPage />
  else if (tab === 'admin' && isAdmin) content = <AdminPage />
  else if (isAdmin) content = <DashboardPage />
  else if (isLocal) content = <PersoneroLocalPage />
  else content = <PersoneroMesaPage />

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-ink-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-2">
            <img
              src="/LOGO-PODEMOS-PERU.png"
              alt="Podemos Peru"
              className="h-8 w-auto object-contain"
            />
            <span className="hidden text-sm font-semibold text-ink-900 sm:inline">
              Resultados Electorales
            </span>
          </div>

          <nav className="order-3 flex w-full gap-1 sm:order-2 sm:ml-4 sm:w-auto">
            {!isAdmin && (
              <NavButton active={tab === 'registro'} onClick={() => setTab('registro')}>
                Registro
              </NavButton>
            )}
            <NavButton active={tab === 'dashboard'} onClick={() => setTab('dashboard')}>
              Dashboard
            </NavButton>
            {isAdmin && (
              <NavButton active={tab === 'admin'} onClick={() => setTab('admin')}>
                Admin
              </NavButton>
            )}
          </nav>

          <div className="order-2 ml-auto flex items-center gap-3 sm:order-3">
            <div className="hidden text-right sm:block">
              <span className="block text-xs font-medium text-ink-800">{user.full_name}</span>
              <span className="block text-[11px] text-ink-400">
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            </div>
            <button type="button" className={btnSecondary} onClick={logout}>
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5">{content}</main>
    </div>
  )
}

function NavButton({
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
        'rounded-lg px-3 py-1.5 text-sm font-medium transition',
        active ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-100',
      )}
    >
      {children}
    </button>
  )
}

function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}

export default App
