import { lazy, Suspense, useEffect } from 'react'
import { HashRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { OutletsProvider } from './context/OutletsContext'
import { ProgrammeContentProvider } from './context/ProgrammeContentContext'
import { OnboardingProvider, useOnboarding } from './context/OnboardingContext'
import { AppShell } from './components/layout/AppShell'
import { DashboardView } from './components/dashboard/DashboardView'
import { TasksView } from './components/tasks/TasksView'
import { ResourcesView } from './components/resources/ResourcesView'
import { WelcomeScreen } from './components/onboarding/WelcomeScreen'
import { ForgotPasswordScreen } from './components/auth/ForgotPasswordScreen'
import { LoginScreen } from './components/auth/LoginScreen'
import { RecoverPasswordScreen } from './components/auth/RecoverPasswordScreen'
import { RegisterScreen } from './components/auth/RegisterScreen'
import { PendingApprovalScreen } from './components/auth/PendingApprovalScreen'
import { PasswordResetScreen } from './components/auth/PasswordResetScreen'
import {
  RequireAdminSession,
  RequireApproved,
  RequireAuth,
  RequireCanManageUsers,
  RequireGuest,
  RequireManageProgramme,
  RequireManagerChecklist,
  RequireViewAuditLog,
} from './components/auth/RouteGuards'
import { AdminRoot } from './components/admin/AdminRoot'
import { initNativeShell, setAndroidBackHandler } from './lib/native'
import { isSupabaseConfigured } from './lib/supabase'

const AdminDashboard = lazy(() =>
  import('./components/admin/AdminDashboard').then((m) => ({
    default: m.AdminDashboard,
  })),
)
const RegistrationsPage = lazy(() =>
  import('./components/admin/RegistrationsPage').then((m) => ({
    default: m.RegistrationsPage,
  })),
)
const UserTable = lazy(() =>
  import('./components/admin/UserTable').then((m) => ({ default: m.UserTable })),
)
const HireDetailPanel = lazy(() =>
  import('./components/admin/HireDetailPanel').then((m) => ({
    default: m.HireDetailPanel,
  })),
)
const ManagerChecklistPage = lazy(() =>
  import('./components/admin/ManagerChecklistPage').then((m) => ({
    default: m.ManagerChecklistPage,
  })),
)
const ProgrammeEditorPage = lazy(() =>
  import('./components/admin/ProgrammeEditorPage').then((m) => ({
    default: m.ProgrammeEditorPage,
  })),
)
const AdminAuditPage = lazy(() =>
  import('./components/admin/AdminAuditPage').then((m) => ({
    default: m.AdminAuditPage,
  })),
)

function AdminFallback() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
    </div>
  )
}

function MobileApp() {
  const {
    activeTab,
    isLoading,
    hasProfile,
    goBack,
    awaitingHireAssignment,
  } = useOnboarding()
  const {
    profile,
    isConfigured,
    canAccessAdmin,
    isLoading: authLoading,
    signOut,
  } = useAuth()

  useEffect(() => {
    void initNativeShell()
  }, [])

  useEffect(() => {
    setAndroidBackHandler(goBack)
    return () => setAndroidBackHandler(null)
  }, [goBack])

  if (isLoading || authLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    )
  }

  if (
    isConfigured &&
    profile &&
    profile.access_role !== 'hire' &&
    canAccessAdmin
  ) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <p className="text-slate-600">You are signed in as an admin user.</p>
        <Link
          to="/admin"
          className="mt-4 rounded-xl bg-brand-700 px-5 py-3 text-sm font-semibold text-white"
        >
          Open admin console
        </Link>
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-3 text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          Sign out
        </button>
      </div>
    )
  }

  if (isConfigured && profile?.access_role === 'pending') {
    return <Navigate to="/pending" replace />
  }

  if (!hasProfile || awaitingHireAssignment) {
    return <WelcomeScreen />
  }

  return (
    <AppShell>
      {activeTab === 'dashboard' && <DashboardView />}
      {activeTab === 'tasks' && <TasksView />}
      {activeTab === 'resources' && <ResourcesView />}
    </AppShell>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<RequireGuest />}>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
      </Route>

      {/* Recovery links establish a session; must not use RequireGuest (would bounce away). */}
      <Route path="/recover-password" element={<RecoverPasswordScreen />} />

      <Route element={<RequireAuth />}>
        <Route path="/pending" element={<PendingApprovalScreen />} />
        <Route path="/reset-password" element={<PasswordResetScreen />} />

        <Route element={<RequireAdminSession />}>
          <Route path="/admin" element={<AdminRoot />}>
            <Route
              index
              element={
                <Suspense fallback={<AdminFallback />}>
                  <AdminDashboard />
                </Suspense>
              }
            />
            <Route
              path="registrations"
              element={
                <Suspense fallback={<AdminFallback />}>
                  <RegistrationsPage />
                </Suspense>
              }
            />
            <Route element={<RequireCanManageUsers />}>
              <Route
                path="users"
                element={
                  <Suspense fallback={<AdminFallback />}>
                    <UserTable />
                  </Suspense>
                }
              />
            </Route>
            <Route element={<RequireManagerChecklist />}>
              <Route
                path="checklist"
                element={
                  <Suspense fallback={<AdminFallback />}>
                    <ManagerChecklistPage />
                  </Suspense>
                }
              />
            </Route>
            <Route element={<RequireManageProgramme />}>
              <Route
                path="programme"
                element={
                  <Suspense fallback={<AdminFallback />}>
                    <ProgrammeEditorPage />
                  </Suspense>
                }
              />
            </Route>
            <Route element={<RequireViewAuditLog />}>
              <Route
                path="audit"
                element={
                  <Suspense fallback={<AdminFallback />}>
                    <AdminAuditPage />
                  </Suspense>
                }
              />
            </Route>
            <Route
              path="hires/:id"
              element={
                <Suspense fallback={<AdminFallback />}>
                  <HireDetailPanel />
                </Suspense>
              }
            />
          </Route>
        </Route>

        <Route element={<RequireApproved />}>
          <Route path="/" element={<MobileApp />} />
        </Route>
      </Route>

      <Route
        path="*"
        element={
          isSupabaseConfigured ? (
            <Navigate to="/login" replace />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
    </Routes>
  )
}

function AppWithProviders() {
  return (
    <AuthProvider>
      <OutletsProvider>
        <ProgrammeContentProvider>
          <OnboardingProvider>
            <AppRoutes />
          </OnboardingProvider>
        </ProgrammeContentProvider>
      </OutletsProvider>
    </AuthProvider>
  )
}

function App() {
  return (
    <HashRouter>
      <AppWithProviders />
    </HashRouter>
  )
}

export default App
