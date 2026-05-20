import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import type {
  HireProfile,
  PendingRegistration,
  Profile,
} from '../types/auth'
import {
  canAccessAdmin,
  canManageRegistrations,
  canManageProgramme,
  canManageUsers,
  isApprovedUser,
} from '../lib/permissions'
import { normalizeAuthEmail } from '../lib/authEmail'
import { formatAuthErrorMessage } from '../lib/authErrors'
import { isSupabaseConfigured, requireSupabase } from '../lib/supabase'

interface AuthContextValue {
  session: Session | null
  profile: Profile | null
  hireProfile: HireProfile | null
  pendingRegistration: PendingRegistration | null
  isLoading: boolean
  isConfigured: boolean
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; redirectTo?: string }>
  signUp: (input: {
    email: string
    password: string
    fullName: string
    requestedOutlet?: string
    requestedJobRole?: string
  }) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  canAccessAdmin: boolean
  canManageRegistrations: boolean
  canManageUsers: boolean
  canManageProgramme: boolean
  isApproved: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchProfile(userId: string): Promise<Profile | null> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('Profile fetch failed:', error.message)
    throw error
  }
  if (data) return data as Profile

  const { data: ensured, error: ensureError } = await client.rpc('ensure_profile')
  if (ensureError) {
    console.error('ensure_profile failed:', ensureError.message)
    return null
  }
  return ensured as Profile | null
}

async function fetchHireProfile(userId: string): Promise<HireProfile | null> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('hire_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data as HireProfile | null
}

async function fetchPendingRegistration(
  userId: string,
): Promise<PendingRegistration | null> {
  const client = requireSupabase()
  const { data, error } = await client
    .from('pending_registrations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data as PendingRegistration | null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [hireProfile, setHireProfile] = useState<HireProfile | null>(null)
  const [pendingRegistration, setPendingRegistration] =
    useState<PendingRegistration | null>(null)
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)

  const loadUserData = useCallback(async (userId: string) => {
    try {
      const nextProfile = await fetchProfile(userId).catch((err) => {
        console.error('Could not load profile:', err)
        return null
      })
      const [nextHire, nextPending] = await Promise.all([
        fetchHireProfile(userId).catch(() => null),
        fetchPendingRegistration(userId).catch(() => null),
      ])
      setProfile(nextProfile)
      setHireProfile(nextHire)
      setPendingRegistration(nextPending)
    } catch (err) {
      console.error('Auth user data load failed:', err)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!session?.user.id) return
    await loadUserData(session.user.id)
  }, [loadUserData, session])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false)
      return
    }

    const client = requireSupabase()
    let mounted = true

    async function init() {
      try {
        const { data } = await client.auth.getSession()
        if (!mounted) return
        setSession(data.session)
        if (data.session?.user.id) {
          await loadUserData(data.session.user.id)
        }
      } catch (err) {
        console.error('Auth init failed:', err)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    void init()

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY' && typeof window !== 'undefined') {
        window.location.hash = '#/recover-password'
      }
      setSession(nextSession)
      if (nextSession?.user.id) {
        void loadUserData(nextSession.user.id).catch((err) => {
          console.error('Auth profile load failed:', err)
        })
      } else {
        setProfile(null)
        setHireProfile(null)
        setPendingRegistration(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadUserData])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const client = requireSupabase()
      // Clear a corrupted or mismatched local session (e.g. after rotating anon key in GitHub Secrets).
      await client.auth.signOut({ scope: 'local' })
      const normalizedEmail = normalizeAuthEmail(email)
      const { error } = await client.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      })
      if (error) {
        console.warn('[auth] signInWithPassword', error.code, error.message)
        return { error: formatAuthErrorMessage(error) }
      }

      const { data: userData } = await client.auth.getUser()
      if (userData.user) {
        await client
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', userData.user.id)

        const profile = await fetchProfile(userData.user.id)
        if (profile) {
          setProfile(profile)
          if (profile.password_reset_required) {
            return { error: null, redirectTo: '/reset-password' }
          }
          if (profile.access_role === 'pending') {
            return { error: null, redirectTo: '/pending' }
          }
          if (canAccessAdmin(profile.access_role) && profile.access_role !== 'hire') {
            return { error: null, redirectTo: '/admin' }
          }
        }
      }
      return { error: null, redirectTo: '/' }
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : 'Sign in failed',
      }
    }
  }, [])

  const signUp = useCallback(
    async (input: {
      email: string
      password: string
      fullName: string
      requestedOutlet?: string
      requestedJobRole?: string
    }) => {
      try {
        const client = requireSupabase()
        const normalizedEmail = normalizeAuthEmail(input.email)
        const { data, error } = await client.auth.signUp({
          email: normalizedEmail,
          password: input.password,
          options: {
            data: { full_name: input.fullName },
          },
        })

        if (error) return { error: formatAuthErrorMessage(error) }
        if (!data.user) return { error: 'Registration failed' }

        const { error: pendingError } = await client
          .from('pending_registrations')
          .insert({
            user_id: data.user.id,
            email: normalizedEmail,
            full_name: input.fullName,
            requested_outlet: input.requestedOutlet || null,
            requested_job_role: input.requestedJobRole || null,
          })

        if (pendingError) return { error: pendingError.message }
        return { error: null }
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : 'Registration failed',
        }
      }
    },
    [],
  )

  const signOut = useCallback(async () => {
    const client = requireSupabase()
    await client.auth.signOut()
    setProfile(null)
    setHireProfile(null)
    setPendingRegistration(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      hireProfile,
      pendingRegistration,
      isLoading,
      isConfigured: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      canAccessAdmin: canAccessAdmin(profile?.access_role),
      canManageRegistrations: canManageRegistrations(profile?.access_role),
      canManageUsers: canManageUsers(profile?.access_role),
      canManageProgramme: canManageProgramme(profile?.access_role),
      isApproved: isApprovedUser(profile?.access_role),
    }),
    [
      session,
      profile,
      hireProfile,
      pendingRegistration,
      isLoading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
