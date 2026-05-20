import { BookOpen, CheckSquare, LayoutDashboard } from 'lucide-react'
import { useOnboarding } from '../../context/OnboardingContext'
import type { TabId } from '../../types/onboarding'

const tabs: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'resources', label: 'Resources', icon: BookOpen },
]

export function BottomNav() {
  const { activeTab, setActiveTab, setSelectedPhaseId } = useOnboarding()

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
    if (tab !== 'tasks') {
      setSelectedPhaseId(null)
    }
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-100 bg-white/95 backdrop-blur-md"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleTabChange(id)}
              className={`flex min-h-[56px] min-w-[72px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 transition-colors active:scale-[0.98] ${
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[11px] font-semibold">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
