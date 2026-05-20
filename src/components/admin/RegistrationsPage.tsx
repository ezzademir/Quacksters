import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { RegistrationQueue } from './RegistrationQueue'

export function RegistrationsPage() {
  const { canManageRegistrations } = useAuth()
  if (!canManageRegistrations) {
    return <Navigate to="/admin" replace />
  }
  return <RegistrationQueue />
}
