import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { api, setToken } from '../api/client'
import type { MeResponse, TokenResponse } from '../api/types'

interface AuthState {
  user: MeResponse | null
  loading: boolean
  loginDni: (dni: string) => Promise<void>
  loginAdmin: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<MeResponse>('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function loginDni(dni: string) {
    const res = await api.post<TokenResponse>('/auth/login/dni', { dni })
    setToken(res.access_token)
    setUser(await api.get<MeResponse>('/auth/me'))
  }

  async function loginAdmin(username: string, password: string) {
    const res = await api.post<TokenResponse>('/auth/login/admin', { username, password })
    setToken(res.access_token)
    setUser(await api.get<MeResponse>('/auth/me'))
  }

  function logout() {
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, loading, loginDni, loginAdmin, logout }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
