import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, LogOut, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useOnboarding } from '../../context/OnboardingContext'

interface HeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  onBack?: () => void
}

export function Header({ title, subtitle, showBack, onBack }: HeaderProps) {
  const { user } = useOnboarding()
  const { session, isConfigured, signOut, canAccessAdmin, profile } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const showAccountMenu = isConfigured && !!session
  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)

  useEffect(() => {
    if (!menuOpen) return

    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-lg px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-2">
            {showBack && onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-700 active:bg-slate-100"
                aria-label="Go back"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-medium uppercase tracking-wider text-brand-600">
                Quackteow · {user.outlet}
              </p>
              <h1 className="truncate text-xl font-bold text-slate-900">{title}</h1>
              {subtitle && (
                <p className="truncate text-sm text-slate-500">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="relative ml-3 shrink-0" ref={menuRef}>
            {showAccountMenu ? (
              <>
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 active:bg-brand-200"
                  aria-label="Account menu"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                >
                  {initials}
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                  >
                    {canAccessAdmin && profile?.access_role !== 'hire' && (
                      <Link
                        to="/admin"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Shield className="h-4 w-4" />
                        Admin console
                      </Link>
                    )}
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false)
                        void signOut()
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {initials}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
