import { AlertTriangle, RefreshCw } from 'lucide-react'
import { useProgrammeContent } from '../../context/ProgrammeContentContext'

export function ProgrammeStatusBanner({ compact = false }: { compact?: boolean }) {
  const { isUsingMockFallback, error, isLoading, refreshProgramme, updatedAt } =
    useProgrammeContent()

  if (!isUsingMockFallback && !error) return null

  if (compact) {
    return (
      <div className="border-b border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            {error ? 'Programme sync failed' : 'Offline programme content'}
          </p>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => void refreshProgramme()}
            className="flex shrink-0 items-center gap-1 font-semibold text-amber-800"
          >
            <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
            Retry
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Programme content may be outdated</p>
            <p className="mt-1 text-amber-800">
              {error
                ? `Could not load live programme from Supabase: ${error}`
                : 'Showing offline fallback content. Run supabase db push and refresh.'}
              {updatedAt && updatedAt !== 'mock' && (
                <span className="block text-xs text-amber-700">
                  Last synced: {new Date(updatedAt).toLocaleString()}
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => void refreshProgramme()}
          className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-200 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Retry
        </button>
      </div>
    </div>
  )
}
