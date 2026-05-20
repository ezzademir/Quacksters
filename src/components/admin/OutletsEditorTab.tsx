import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useOutlets } from '../../context/OutletsContext'
import {
  adminDeleteOutlet,
  adminListOutlets,
  adminUpsertOutlet,
  type Outlet,
} from '../../lib/outletsApi'

function newId() {
  return `outlet-${crypto.randomUUID().slice(0, 8)}`
}

export function OutletsEditorTab() {
  const { refreshOutlets } = useOutlets()
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editing, setEditing] = useState<Outlet | null>(null)

  async function load() {
    setIsLoading(true)
    setError(null)
    try {
      setOutlets(await adminListOutlets())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load outlets')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function save(outlet: Outlet) {
    try {
      const rows = await adminUpsertOutlet({
        id: outlet.id,
        name: outlet.name,
        sortOrder: outlet.sortOrder,
        isActive: outlet.isActive,
      })
      setOutlets(rows)
      setEditing(null)
      await refreshOutlets()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  async function deactivate(id: string) {
    if (!confirm('Deactivate this outlet?')) return
    try {
      setOutlets(await adminDeleteOutlet(id))
      await refreshOutlets()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  if (isLoading) return <p className="text-slate-500">Loading outlets…</p>

  return (
    <div className="mt-6 space-y-3">
      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      <button
        type="button"
        onClick={() =>
          setEditing({
            id: newId(),
            name: '',
            sortOrder: outlets.length,
            isActive: true,
          })
        }
        className="flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
      >
        <Plus className="h-4 w-4" />
        Add outlet
      </button>
      {outlets.map((o) => (
        <div
          key={o.id}
          className={`flex items-center justify-between rounded-xl bg-white p-4 ring-1 ring-slate-200 ${!o.isActive ? 'opacity-50' : ''}`}
        >
          <div>
            <p className="font-semibold text-slate-900">{o.name}</p>
            <p className="text-xs text-slate-500">
              Order {o.sortOrder} · {o.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
          <div className="flex gap-1">
            <button type="button" onClick={() => setEditing(o)}>
              <Pencil className="h-4 w-4 text-slate-500" />
            </button>
            {o.isActive && (
              <button type="button" onClick={() => void deactivate(o.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </button>
            )}
          </div>
        </div>
      ))}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            className="w-full max-w-md space-y-3 rounded-2xl bg-white p-5"
            onSubmit={(e) => {
              e.preventDefault()
              void save(editing)
            }}
          >
            <h3 className="font-bold text-slate-900">Edit outlet</h3>
            <input
              required
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Outlet name"
            />
            <input
              type="number"
              value={editing.sortOrder}
              onChange={(e) =>
                setEditing({ ...editing, sortOrder: Number(e.target.value) })
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 rounded-xl bg-brand-700 py-2 text-sm font-semibold text-white"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
