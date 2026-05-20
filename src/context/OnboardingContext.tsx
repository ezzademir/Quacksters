import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  defaultUserProfile,
} from '../data/mockData'
import { filterValidCompletedIds } from '../lib/programmeTasks'
import {
  getHireTasksForRole,
  getPersonalizedDashboardSubtitle,
  getPersonalizedGreeting,
  getPhasesForRole,
  getRoleLabel,
  getResourcesForRole,
  resolveTaskForHire,
} from '../lib/onboardingPersonalization'
import { getMilestoneEvents } from '../lib/milestones'
import { scheduleMilestoneNotifications } from '../lib/native'
import { getStoredJson, setStoredJson, STORAGE_KEYS } from '../lib/storage'
import { requireSupabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { useProgrammeContent } from './ProgrammeContentContext'
import { hireProfileToUserProfile } from '../types/onboarding'
import type {
  OnboardingPhase,
  OnboardingProgress,
  OnboardingTask,
  PhaseProgress,
  ResolvedHireTask,
  Resource,
  TabId,
  UserProfile,
} from '../types/onboarding'

interface OnboardingContextValue {
  user: UserProfile
  isLoading: boolean
  hasProfile: boolean
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
  selectedPhaseId: string | null
  setSelectedPhaseId: (phaseId: string | null) => void
  completedTaskIds: Set<string>
  toggleTask: (taskId: string) => void
  isTaskCompleted: (taskId: string) => boolean
  overallProgress: { completed: number; total: number; percentage: number }
  phaseProgress: PhaseProgress[]
  relevantPhases: OnboardingPhase[]
  relevantResources: Resource[]
  roleLabel: string
  personalizedGreeting: string
  personalizedDashboardSubtitle: string
  resolveTaskForHire: (task: OnboardingTask) => ResolvedHireTask
  nextIncompleteTask: OnboardingTask | null
  saveProfile: (profile: UserProfile) => Promise<void>
  confirmHireProfile: () => Promise<void>
  resetProgress: () => Promise<void>
  goBack: () => boolean
  isOfflineMode: boolean
  awaitingHireAssignment: boolean
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null)

function mergeProgress(
  local: OnboardingProgress | null,
  remote: { completed_task_ids: string[]; last_updated: string } | null,
): string[] {
  if (!remote) return local?.completedTaskIds ?? []
  if (!local) return remote.completed_task_ids
  const localTime = new Date(local.lastUpdated).getTime()
  const remoteTime = new Date(remote.last_updated).getTime()
  return remoteTime >= localTime
    ? remote.completed_task_ids
    : local.completedTaskIds
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const {
    session,
    profile: authProfile,
    hireProfile,
    isLoading: authLoading,
    isConfigured,
    refreshProfile,
  } = useAuth()
  const { phases, resources, feedbackSchedule } = useProgrammeContent()

  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<UserProfile>(defaultUserProfile)
  const [hasProfile, setHasProfile] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null)
  const [storedCompletedTaskIds, setStoredCompletedTaskIds] = useState<Set<string>>(
    new Set(),
  )
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const completedTaskIds = useMemo(
    () => new Set(filterValidCompletedIds([...storedCompletedTaskIds], phases)),
    [storedCompletedTaskIds, phases],
  )

  const isOfflineMode = !isConfigured || !session
  const awaitingHireAssignment =
    isConfigured &&
    !!session &&
    authProfile?.access_role === 'hire' &&
    !hireProfile

  useEffect(() => {
    async function hydrate() {
      if (authLoading) return

      if (isOfflineMode) {
        const [storedProfile, storedProgress] = await Promise.all([
          getStoredJson<UserProfile>(STORAGE_KEYS.profile),
          getStoredJson<OnboardingProgress>(STORAGE_KEYS.progress),
        ])

        if (storedProfile?.name) {
          setUser(storedProfile)
          setHasProfile(true)
        }

        if (storedProgress?.completedTaskIds) {
          setStoredCompletedTaskIds(new Set(storedProgress.completedTaskIds))
        }

        setIsLoading(false)
        return
      }

      if (!session?.user.id || !authProfile) {
        setIsLoading(false)
        return
      }

      if (authProfile.access_role === 'hire' && hireProfile) {
        const mapped = hireProfileToUserProfile(
          session.user.id,
          authProfile.full_name,
          hireProfile,
        )
        setUser(mapped)

        const client = requireSupabase()
        const { data: remoteProgress } = await client
          .from('onboarding_progress')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle()

        const localProgress = await getStoredJson<OnboardingProgress>(
          STORAGE_KEYS.progress,
        )
        const mergedIds = mergeProgress(localProgress, remoteProgress)
        setStoredCompletedTaskIds(new Set(mergedIds))

        const confirmed = Boolean(hireProfile.confirmed_at)
        setHasProfile(confirmed)

        if (confirmed) {
          await setStoredJson(STORAGE_KEYS.profile, mapped)
          await setStoredJson<OnboardingProgress>(STORAGE_KEYS.progress, {
            completedTaskIds: mergedIds,
            lastUpdated:
              remoteProgress?.last_updated ?? new Date().toISOString(),
          })
        }
      }

      setIsLoading(false)
    }

    void hydrate()
  }, [
    authLoading,
    authProfile,
    hireProfile,
    isOfflineMode,
    session?.user.id,
  ])

  const relevantPhases = useMemo(
    () => getPhasesForRole(user.role, phases),
    [phases, user.role],
  )

  const relevantTasks = useMemo(
    () => getHireTasksForRole(user.role, phases),
    [phases, user.role],
  )

  const relevantResources = useMemo(
    () => getResourcesForRole(user.role, resources),
    [resources, user.role],
  )

  const roleLabel = useMemo(() => getRoleLabel(user.role), [user.role])
  const personalizedGreeting = useMemo(
    () => getPersonalizedGreeting(user),
    [user],
  )
  const personalizedDashboardSubtitle = useMemo(
    () => getPersonalizedDashboardSubtitle(user),
    [user],
  )

  const persistProgressLocal = useCallback(async (ids: string[]) => {
    await setStoredJson<OnboardingProgress>(STORAGE_KEYS.progress, {
      completedTaskIds: ids,
      lastUpdated: new Date().toISOString(),
    })
  }, [])

  const syncProgressRemote = useCallback(
    (ids: string[]) => {
      if (!session?.user.id || isOfflineMode) return

      if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
      syncTimerRef.current = setTimeout(() => {
        void (async () => {
          const client = requireSupabase()
          await client.from('onboarding_progress').upsert({
            user_id: session.user.id,
            completed_task_ids: ids,
            last_updated: new Date().toISOString(),
          })
        })()
      }, 500)
    },
    [isOfflineMode, session],
  )

  const toggleTask = useCallback(
    (taskId: string) => {
      setStoredCompletedTaskIds((prev) => {
        const next = new Set(prev)
        if (next.has(taskId)) {
          next.delete(taskId)
        } else {
          next.add(taskId)
        }
        const ids = filterValidCompletedIds([...next], phases)
        void persistProgressLocal(ids)
        syncProgressRemote(ids)
        return new Set(ids)
      })
    },
    [persistProgressLocal, phases, syncProgressRemote],
  )

  const isTaskCompleted = useCallback(
    (taskId: string) => completedTaskIds.has(taskId),
    [completedTaskIds],
  )

  const overallProgress = useMemo(() => {
    const total = relevantTasks.length
    const completed = relevantTasks.filter((t) =>
      completedTaskIds.has(t.id),
    ).length
    return {
      completed,
      total,
      percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
    }
  }, [completedTaskIds, relevantTasks])

  const phaseProgress = useMemo<PhaseProgress[]>(() => {
    return relevantPhases.map((phase) => {
      const tasks = phase.sections.flatMap((s) => s.tasks)
      const completed = tasks.filter((t) => completedTaskIds.has(t.id)).length
      const total = tasks.length
      return {
        phaseId: phase.id,
        completed,
        total,
        percentage: total === 0 ? 0 : Math.round((completed / total) * 100),
      }
    })
  }, [completedTaskIds, relevantPhases])

  const nextIncompleteTask = useMemo(() => {
    return relevantTasks.find((task) => !completedTaskIds.has(task.id)) ?? null
  }, [completedTaskIds, relevantTasks])

  const saveProfile = useCallback(async (profile: UserProfile) => {
    const payload: UserProfile = {
      ...profile,
      id: profile.id || `hire-${Date.now()}`,
    }
    await setStoredJson(STORAGE_KEYS.profile, payload)
    setUser(payload)
    setHasProfile(true)
    await scheduleMilestoneNotifications(payload, feedbackSchedule)
  }, [feedbackSchedule])

  const confirmHireProfile = useCallback(async () => {
    if (!session?.user.id || !hireProfile || !authProfile) return

    const client = requireSupabase()
    const now = new Date().toISOString()
    await client
      .from('hire_profiles')
      .update({ confirmed_at: now })
      .eq('user_id', session.user.id)

    const mapped = hireProfileToUserProfile(
      session.user.id,
      authProfile.full_name,
      hireProfile,
    )
    await setStoredJson(STORAGE_KEYS.profile, mapped)
    setUser(mapped)
    setHasProfile(true)
    await scheduleMilestoneNotifications(mapped, feedbackSchedule)
    await refreshProfile()
  }, [authProfile, feedbackSchedule, hireProfile, refreshProfile, session])

  const resetProgress = useCallback(async () => {
    setStoredCompletedTaskIds(new Set())
    await persistProgressLocal([])
    syncProgressRemote([])
  }, [persistProgressLocal, syncProgressRemote])

  const goBack = useCallback(() => {
    if (selectedPhaseId) {
      setSelectedPhaseId(null)
      return true
    }
    if (activeTab !== 'dashboard') {
      setActiveTab('dashboard')
      return true
    }
    return false
  }, [activeTab, selectedPhaseId])

  const value = useMemo<OnboardingContextValue>(
    () => ({
      user,
      isLoading: isLoading || authLoading,
      hasProfile,
      activeTab,
      setActiveTab,
      selectedPhaseId,
      setSelectedPhaseId,
      completedTaskIds,
      toggleTask,
      isTaskCompleted,
      overallProgress,
      phaseProgress,
      relevantPhases,
      relevantResources,
      roleLabel,
      personalizedGreeting,
      personalizedDashboardSubtitle,
      resolveTaskForHire,
      nextIncompleteTask,
      saveProfile,
      confirmHireProfile,
      resetProgress,
      goBack,
      isOfflineMode,
      awaitingHireAssignment,
    }),
    [
      user,
      isLoading,
      authLoading,
      hasProfile,
      activeTab,
      selectedPhaseId,
      completedTaskIds,
      toggleTask,
      isTaskCompleted,
      overallProgress,
      phaseProgress,
      relevantPhases,
      relevantResources,
      roleLabel,
      personalizedGreeting,
      personalizedDashboardSubtitle,
      nextIncompleteTask,
      saveProfile,
      confirmHireProfile,
      resetProgress,
      goBack,
      isOfflineMode,
      awaitingHireAssignment,
    ],
  )

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext)
  if (!ctx) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return ctx
}

export function useMilestones() {
  const { user } = useOnboarding()
  const { feedbackSchedule } = useProgrammeContent()
  return useMemo(
    () => getMilestoneEvents(user.startDate, feedbackSchedule),
    [feedbackSchedule, user.startDate],
  )
}
