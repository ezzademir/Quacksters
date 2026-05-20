import { describe, expect, it } from 'vitest'
import {
  canAccessAdmin,
  canManageProgramme,
  canManageRegistrations,
  canManageUsers,
  canViewAuditLog,
  canViewHireInOutlet,
  isApprovedUser,
  isHireUser,
} from './permissions'

describe('permissions', () => {
  it('allows admin console access for manager roles', () => {
    expect(canAccessAdmin('admin')).toBe(true)
    expect(canAccessAdmin('supervisor')).toBe(true)
    expect(canAccessAdmin('hire')).toBe(false)
    expect(canAccessAdmin('pending')).toBe(false)
  })

  it('restricts programme editing to admin only', () => {
    expect(canManageProgramme('admin')).toBe(true)
    expect(canManageProgramme('hr_ops')).toBe(false)
    expect(canManageProgramme('gm')).toBe(false)
  })

  it('allows audit log read for admin and HR Ops', () => {
    expect(canViewAuditLog('admin')).toBe(true)
    expect(canViewAuditLog('hr_ops')).toBe(true)
    expect(canViewAuditLog('gm')).toBe(false)
    expect(canViewAuditLog('supervisor')).toBe(false)
  })

  it('allows registration management for hr_ops and admin', () => {
    expect(canManageRegistrations('admin')).toBe(true)
    expect(canManageRegistrations('hr_ops')).toBe(true)
    expect(canManageRegistrations('gm')).toBe(false)
  })

  it('allows user management for admin, hr_ops, and gm', () => {
    expect(canManageUsers('admin')).toBe(true)
    expect(canManageUsers('hr_ops')).toBe(true)
    expect(canManageUsers('gm')).toBe(true)
    expect(canManageUsers('supervisor')).toBe(false)
  })

  it('identifies approved and hire users', () => {
    expect(isApprovedUser('hire')).toBe(true)
    expect(isApprovedUser('pending')).toBe(false)
    expect(isHireUser('hire')).toBe(true)
    expect(isHireUser('gm')).toBe(false)
  })

  it('scopes hire visibility by outlet for supervisors', () => {
    expect(canViewHireInOutlet('admin', null, 'TTDI')).toBe(true)
    expect(canViewHireInOutlet('supervisor', 'TTDI', 'TTDI')).toBe(true)
    expect(canViewHireInOutlet('supervisor', 'TTDI', 'PJ')).toBe(false)
    expect(canViewHireInOutlet('hr_ops', null, 'PJ')).toBe(true)
  })
})
