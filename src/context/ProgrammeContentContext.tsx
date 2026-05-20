import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchProgramme,
  getMockProgramme,
  PROGRAMME_CACHE_KEY,
  type ProgrammeContent,
} from '../lib/programmeApi'
import { getStoredJson, setStoredJson } from '../lib/storage'
import { isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface ProgrammeContentContextValue extends ProgrammeContent {
  isLoading: boolean
  error: string | null
  isUsingMockFallback: boolean
  refreshProgramme: () => Promise<void>
  applyProgramme: (content: ProgrammeContent) => Promise<void>
}

const ProgrammeContentContext =
  createContext<ProgrammeContentContextValue | null>(null)

export function ProgrammeContentProvider({ children }: { children: ReactNode }) {
  const { session, isLoading: authLoading } = useAuth()
  const [content, setContent] = useState<ProgrammeContent>(getMockProgramme())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingMockFallback, setIsUsingMockFallback] = useState(
    !isSupabaseConfigured,
  )

  const applyProgramme = useCallback(async (next: ProgrammeContent) => {
    setContent(next)
    setIsUsingMockFallback(false)
    await setStoredJson(PROGRAMME_CACHE_KEY, next)
  }, [])

  const refreshProgramme = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setContent(getMockProgramme())
      setIsUsingMockFallback(true)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const remote = await fetchProgramme()
      await applyProgramme(remote)
      setIsUsingMockFallback(false)
    } catch (err) {
      const cached = await getStoredJson<ProgrammeContent>(PROGRAMME_CACHE_KEY)
      if (cached?.phases?.length) {
        setContent(cached)
        setIsUsingMockFallback(true)
      } else {
        setContent(getMockProgramme())
        setIsUsingMockFallback(true)
      }
      setError(err instanceof Error ? err.message : 'Failed to load programme')
    } finally {
      setIsLoading(false)
    }
  }, [applyProgramme])

  useEffect(() => {
    if (authLoading) return

    async function init() {
      const cached = await getStoredJson<ProgrammeContent>(PROGRAMME_CACHE_KEY)
      if (cached?.phases?.length) {
        setContent(cached)
        setIsLoading(false)
      }

      if (isSupabaseConfigured && session) {
        void refreshProgramme()
      } else if (!cached?.phases?.length) {
        setContent(getMockProgramme())
        setIsUsingMockFallback(true)
        setIsLoading(false)
      }
    }

    void init()
  }, [authLoading, refreshProgramme, session])

  useEffect(() => {
    function onFocus() {
      if (isSupabaseConfigured && session) {
        void refreshProgramme()
      }
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refreshProgramme, session])

  useEffect(() => {
    if (!isSupabaseConfigured || !session) return
    const interval = setInterval(() => {
      void refreshProgramme()
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refreshProgramme, session])

  const value = useMemo<ProgrammeContentContextValue>(
    () => ({
      ...content,
      isLoading,
      error,
      isUsingMockFallback,
      refreshProgramme,
      applyProgramme,
    }),
    [applyProgramme, content, error, isLoading, isUsingMockFallback, refreshProgramme],
  )

  return (
    <ProgrammeContentContext.Provider value={value}>
      {children}
    </ProgrammeContentContext.Provider>
  )
}

export function useProgrammeContent(): ProgrammeContentContextValue {
  const ctx = useContext(ProgrammeContentContext)
  if (!ctx) {
    throw new Error('useProgrammeContent must be used within ProgrammeContentProvider')
  }
  return ctx
}
