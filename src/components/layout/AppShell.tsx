import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { ProgrammeStatusBanner } from '../admin/ProgrammeStatusBanner'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-slate-50">
      <ProgrammeStatusBanner compact />
      <main className="pb-[calc(5.5rem+env(safe-area-inset-bottom))]">{children}</main>
      <BottomNav />
    </div>
  )
}
