import { requireSupabase } from './supabase'

export interface Outlet {
  id: string
  name: string
  sortOrder: number
  isActive: boolean
}

export const FALLBACK_OUTLETS = [
  'TTDI',
  '1 Utama',
  'Merdeka',
  'PJ',
  'Hartamas',
] as const

export async function fetchOutlets(): Promise<Outlet[]> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('list_outlets')
  if (error) throw new Error(error.message)
  return (data ?? []).map((row: { id: string; name: string; sort_order: number; is_active: boolean }) => ({
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  }))
}

export async function adminListOutlets(): Promise<Outlet[]> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_list_outlets')
  if (error) throw new Error(error.message)
  return (data ?? []).map((row: { id: string; name: string; sort_order: number; is_active: boolean }) => ({
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    isActive: row.is_active,
  }))
}

export async function adminUpsertOutlet(payload: {
  id: string
  name: string
  sortOrder?: number
  isActive?: boolean
}): Promise<Outlet[]> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_upsert_outlet', {
    p_id: payload.id,
    p_name: payload.name,
    p_sort_order: payload.sortOrder ?? 0,
    p_is_active: payload.isActive ?? true,
  })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row: { id: string; name: string; sortOrder: number; isActive: boolean }) => ({
    id: row.id,
    name: row.name,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  }))
}

export async function adminDeleteOutlet(id: string): Promise<Outlet[]> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_delete_outlet', { p_id: id })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row: { id: string; name: string; sortOrder: number; isActive: boolean }) => ({
    id: row.id,
    name: row.name,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  }))
}

export async function logAdminAction(
  action: string,
  entityType: string,
  entityId?: string,
  details: Record<string, unknown> = {},
): Promise<void> {
  const client = requireSupabase()
  await client.rpc('log_admin_action', {
    p_action: action,
    p_entity_type: entityType,
    p_entity_id: entityId ?? null,
    p_details: details,
  })
}
