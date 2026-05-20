import { AuditLogTab } from './AuditLogTab'

/** Admin + HR Ops: read-only activity log (/admin/audit). */
export function AdminAuditPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Audit log</h2>
      <p className="mt-1 text-slate-600">
        Registration approvals, user updates, and programme edits (subset may appear only for
        system admins depending on RPC coverage).
      </p>
      <AuditLogTab />
    </div>
  )
}
