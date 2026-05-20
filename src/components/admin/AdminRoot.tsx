import { useAdminAccessGate } from '../auth/RouteGuards'
import { AdminLayout } from './AdminLayout'

/** Single /admin layout route so nested pages (users, registrations) render reliably. */
export function AdminRoot() {
  const gate = useAdminAccessGate()
  if (gate) return gate
  return <AdminLayout />
}
