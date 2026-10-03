import { useAuth } from '../auth/AuthContext'
import { VoteForm } from '../components/VoteForm'

export function PersoneroMesaPage() {
  const { user } = useAuth()
  const tableId = user?.scopes.find((s) => s.table_id)?.table_id ?? null

  if (!tableId)
    return (
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
        No tiene una mesa asignada.
      </p>
    )

  return (
    <main className="rounded-2xl border border-ink-200 bg-white p-4 sm:p-6">
      <VoteForm tableId={tableId} />
    </main>
  )
}
