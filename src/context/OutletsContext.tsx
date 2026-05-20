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
  FALLBACK_OUTLETS,
  fetchOutlets,
  type Outlet,
} from '../lib/outletsApi'
import { isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface OutletsContextValue {
  outlets: Outlet[]
  outletNames: string[]
  isLoading: boolean
  refreshOutlets: () => Promise<void>
}

const OutletsContext = createContext<OutletsContextValue | null>(null)

function fallbackOutlets(): Outlet[] {
  return FALLBACK_OUTLETS.map((name, i) => ({
    id: `fallback-${i}`,
    name,
    sortOrder: i,
    isActive: true,
  }))
}

export function OutletsProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [outlets, setOutlets] = useState<Outlet[]>(fallbackOutlets())
  const [isLoading, setIsLoading] = useState(false)

  const refreshOutlets = useCallback(async () => {
    if (!isSupabaseConfigured || !session) {
      setOutlets(fallbackOutlets())
      return
    }
    setIsLoading(true)
    try {
      const rows = await fetchOutlets()
      if (rows.length > 0) setOutlets(rows)
      else setOutlets(fallbackOutlets())
    } catch {
      setOutlets(fallbackOutlets())
    } finally {
      setIsLoading(false)
    }
  }, [session])

  useEffect(() => {
    void refreshOutlets()
  }, [refreshOutlets])

  const outletNames = useMemo(
    () => outlets.filter((o) => o.isActive).map((o) => o.name),
    [outlets],
  )

  const value = useMemo(
    () => ({ outlets, outletNames, isLoading, refreshOutlets }),
    [outletNames, outlets, isLoading, refreshOutlets],
  )

  return (
    <OutletsContext.Provider value={value}>{children}</OutletsContext.Provider>
  )
}

export function useOutlets(): OutletsContextValue {
  const ctx = useContext(OutletsContext)
  if (!ctx) {
    throw new Error('useOutlets must be used within OutletsProvider')
  }
  return ctx
}
