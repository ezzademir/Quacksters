import { requireSupabase } from './supabase'

export interface AuditLogEntry {
  id: string
  action: string
  entityType: string
  entityId: string | null
  details: Record<string, unknown>
  createdAt: string
  actorId: string | null
  actorName: string
  actorEmail: string
}

export interface AuditLogFilters {
  limit?: number
  offset?: number
  action?: string | null
  entityType?: string | null
  since?: string | null
  until?: string | null
  search?: string | null
}

/** Escape a CSV field (RFC-style). */
export function csvEscape(value: string): string {
  if (/[,"\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export async function adminFetchAuditLog(
  filters: AuditLogFilters = {},
): Promise<AuditLogEntry[]> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_list_audit_log', {
    p_limit: filters.limit ?? 50,
    p_offset: filters.offset ?? 0,
    p_action: filters.action ?? null,
    p_entity_type: filters.entityType ?? null,
    p_since: filters.since ?? null,
    p_until: filters.until ?? null,
    p_search: filters.search ?? null,
  })

  if (error) throw new Error(error.message)

  return (data ?? []).map(
    (row: {
      id: string
      action: string
      entity_type: string
      entity_id: string | null
      details: Record<string, unknown>
      created_at: string
      actor_id: string | null
      actor_name: string
      actor_email: string
    }) => ({
      id: row.id,
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      details: row.details ?? {},
      createdAt: row.created_at,
      actorId: row.actor_id,
      actorName: row.actor_name ?? '',
      actorEmail: row.actor_email ?? '',
    }),
  )
}

export function auditLogEntriesToCsv(rows: AuditLogEntry[]): string {
  const header =
    'created_at,action,entity_type,entity_id,actor_name,actor_email,details_json'
  const lines = rows.map((r) =>
    [
      csvEscape(r.createdAt),
      csvEscape(r.action),
      csvEscape(r.entityType),
      csvEscape(r.entityId ?? ''),
      csvEscape(r.actorName),
      csvEscape(r.actorEmail),
      csvEscape(JSON.stringify(r.details)),
    ].join(','),
  )
  return [header, ...lines].join('\r\n')
}
