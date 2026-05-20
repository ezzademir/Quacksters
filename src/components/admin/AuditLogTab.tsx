import { useCallback, useEffect, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import {
  adminFetchAuditLog,
  auditLogEntriesToCsv,
  type AuditLogEntry,
  type AuditLogFilters,
} from '../../lib/auditApi'

const PAGE_SIZE = 50

const ENTITY_TYPE_PRESETS = [
  { value: '', label: 'All types' },
  { value: 'registration', label: 'registration' },
  { value: 'profile', label: 'profile' },
  { value: 'phases', label: 'phases (programme)' },
  { value: 'resources', label: 'resources (programme)' },
  { value: 'contacts', label: 'contacts (programme)' },
  { value: 'tasks', label: 'tasks (programme)' },
  { value: 'sections', label: 'sections (programme)' },
  { value: 'section', label: 'section' },
  { value: 'task', label: 'task' },
  { value: 'resource', label: 'resource' },
  { value: 'contact', label: 'contact' },
  { value: 'feedback_item', label: 'feedback_item' },
  { value: 'feedback_schedule', label: 'feedback_schedule' },
  { value: 'outlet', label: 'outlet' },
]

function endOfDayIso(dateStr: string): string | null {
  if (!dateStr.trim()) return null
  const d = new Date(`${dateStr}T23:59:59.999`)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

export function AuditLogTab() {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [filterAction, setFilterAction] = useState('')
  const [filterEntityType, setFilterEntityType] = useState('')
  const [filterSince, setFilterSince] = useState('')
  const [filterUntil, setFilterUntil] = useState('')
  const [filterSearch, setFilterSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  const buildFiltersBase = useCallback(
    (): Omit<AuditLogFilters, 'offset'> => ({
      limit: PAGE_SIZE,
      action: filterAction.trim() || null,
      entityType: filterEntityType.trim() || null,
      since: filterSince.trim()
        ? new Date(`${filterSince}T00:00:00`).toISOString()
        : null,
      until: filterUntil.trim() ? endOfDayIso(filterUntil) : null,
      search: filterSearch.trim() || null,
    }),
    [
      filterAction,
      filterEntityType,
      filterSince,
      filterUntil,
      filterSearch,
    ],
  )

  const fetchReplace = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const rows = await adminFetchAuditLog({
        ...buildFiltersBase(),
        offset: 0,
        limit: PAGE_SIZE,
      })
      setEntries(rows)
      setHasMore(rows.length >= PAGE_SIZE)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit log')
      setEntries([])
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }, [buildFiltersBase])

  const fetchAppend = useCallback(async () => {
    setIsLoadingMore(true)
    setError(null)
    try {
      const rows = await adminFetchAuditLog({
        ...buildFiltersBase(),
        offset: entries.length,
        limit: PAGE_SIZE,
      })
      setEntries((prev) => [...prev, ...rows])
      setHasMore(rows.length >= PAGE_SIZE)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more')
      setHasMore(false)
    } finally {
      setIsLoadingMore(false)
    }
  }, [buildFiltersBase, entries.length])

  useEffect(() => {
    void fetchReplace()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial filters only on mount
  }, [])

  const handleApplyFilters = useCallback(() => {
    void fetchReplace()
  }, [fetchReplace])

  const handleExportCsv = useCallback(() => {
    const blob = new Blob([auditLogEntriesToCsv(entries)], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [entries])

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => void fetchReplace()}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        <button
          type="button"
          disabled={entries.length === 0}
          onClick={handleExportCsv}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Filters
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-xs font-medium text-slate-600">
            Action contains
            <input
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              placeholder="e.g. approve, reorder"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Entity type
            <select
              value={filterEntityType}
              onChange={(e) => setFilterEntityType(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              {ENTITY_TYPE_PRESETS.map((o) => (
                <option key={o.value || 'all'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-600">
            Full-text (id / JSON)
            <input
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Search entity_id or details"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            From date
            <input
              type="date"
              value={filterSince}
              onChange={(e) => setFilterSince(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs font-medium text-slate-600">
            To date (inclusive end of day)
            <input
              type="date"
              value={filterUntil}
              onChange={(e) => setFilterUntil(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleApplyFilters}
              disabled={isLoading}
              className="w-full rounded-xl bg-brand-700 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Apply filters
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {isLoading ? (
        <p className="text-slate-500">Loading audit log…</p>
      ) : !entries.length && !error ? (
        <p className="text-slate-500">No audit entries match.</p>
      ) : (
        <>
          <p className="text-xs text-slate-500">
            Showing {entries.length} entr{entries.length !== 1 ? 'ies' : 'y'}{' '}
            (max {PAGE_SIZE} per fetch). Export CSV includes all loaded rows below.
          </p>
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl bg-white p-4 text-sm ring-1 ring-slate-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {entry.action} · {entry.entityType}
                      {entry.entityId && (
                        <span className="ml-1 font-normal text-slate-500">
                          ({entry.entityId})
                        </span>
                      )}
                    </p>
                    {(entry.actorName || entry.actorEmail) && (
                      <p className="mt-1 text-xs text-slate-500">
                        By {entry.actorName || 'Unknown'}
                        {entry.actorEmail ? ` · ${entry.actorEmail}` : ''}
                      </p>
                    )}
                  </div>
                  <time className="shrink-0 text-xs text-slate-400">
                    {new Date(entry.createdAt).toLocaleString()}
                  </time>
                </div>
                {Object.keys(entry.details).length > 0 && (
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-50 p-2 text-xs text-slate-600">
                    {JSON.stringify(entry.details, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                type="button"
                disabled={isLoadingMore}
                onClick={() => void fetchAppend()}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {isLoadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
