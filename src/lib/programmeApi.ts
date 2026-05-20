import {
  contacts as mockContacts,
  feedbackSchedule as mockFeedbackSchedule,
  onboardingPhases as mockPhases,
  resources as mockResources,
} from '../data/mockData'
import { requireSupabase } from './supabase'
import { logAdminAction } from './outletsApi'
import type {
  ContactPerson,
  FeedbackScheduleItem,
  OnboardingPhase,
  OnboardingTask,
  OwnerCode,
  Resource,
  RoleFilter,
  TaskAudience,
  TaskSection,
} from '../types/onboarding'

export interface ProgrammeContent {
  phases: OnboardingPhase[]
  resources: Resource[]
  contacts: ContactPerson[]
  feedbackSchedule: FeedbackScheduleItem[]
  updatedAt: string
}

export const PROGRAMME_CACHE_KEY = 'quackteow-programme-content'

interface RawTask {
  id: string
  title: string
  whyItMatters?: string | null
  howTo?: string | null
  owner: OwnerCode
  roles: RoleFilter[]
  audience?: TaskAudience
  titleHire?: string | null
  whyItMattersHire?: string | null
  howToHire?: string | null
}

interface RawSection {
  id: string
  title: string
  subtitle?: string
  tasks: RawTask[]
}

interface RawPhase {
  id: string
  number: number
  title: string
  subtitle: string
  dayRange: string
  description: string
  milestones?: string[]
  descriptionByRole?: Partial<Record<RoleFilter, string>>
  milestonesByRole?: Partial<Record<RoleFilter, string[]>>
  sections: RawSection[]
}

interface RawResource {
  id: string
  title: string
  description: string
  category: Resource['category']
  reference?: string | null
  url?: string | null
  owner?: OwnerCode | null
  roles: RoleFilter[]
}

interface RawContact {
  id: string
  name: string
  role: string
  ownerCode: OwnerCode
  responsibility: string
  contactHint: string
}

interface RawFeedback {
  id?: string
  day: string
  dayNumber: number
  method: string
  owner: string
}

interface RawProgramme {
  phases: RawPhase[]
  resources: RawResource[]
  contacts: RawContact[]
  feedbackSchedule: RawFeedback[]
  updatedAt?: string
}

function mapTask(raw: RawTask): OnboardingTask {
  return {
    id: raw.id,
    title: raw.title,
    whyItMatters: raw.whyItMatters ?? undefined,
    howTo: raw.howTo ?? undefined,
    owner: raw.owner,
    roles: raw.roles,
    audience: raw.audience ?? 'hire',
    titleHire: raw.titleHire ?? undefined,
    whyItMattersHire: raw.whyItMattersHire ?? undefined,
    howToHire: raw.howToHire ?? undefined,
  }
}

function mapSection(raw: RawSection): TaskSection {
  return {
    id: raw.id,
    title: raw.title,
    subtitle: raw.subtitle ?? undefined,
    tasks: (raw.tasks ?? []).map(mapTask),
  }
}

export function parseProgramme(raw: RawProgramme): ProgrammeContent {
  return {
    phases: (raw.phases ?? []).map((phase) => ({
      id: phase.id,
      number: phase.number,
      title: phase.title,
      subtitle: phase.subtitle,
      dayRange: phase.dayRange,
      description: phase.description,
      milestones: phase.milestones,
      descriptionByRole: phase.descriptionByRole,
      milestonesByRole: phase.milestonesByRole,
      sections: (phase.sections ?? []).map(mapSection),
    })),
    resources: (raw.resources ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      reference: r.reference ?? undefined,
      url: r.url ?? undefined,
      owner: r.owner ?? undefined,
      roles: r.roles,
    })),
    contacts: (raw.contacts ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      role: c.role,
      ownerCode: c.ownerCode,
      responsibility: c.responsibility,
      contactHint: c.contactHint,
    })),
    feedbackSchedule: (raw.feedbackSchedule ?? []).map((f) => ({
      id: f.id,
      day: f.day,
      dayNumber: f.dayNumber,
      method: f.method,
      owner: f.owner,
    })),
    updatedAt: raw.updatedAt ?? new Date().toISOString(),
  }
}

export function getMockProgramme(): ProgrammeContent {
  return {
    phases: mockPhases,
    resources: mockResources,
    contacts: mockContacts,
    feedbackSchedule: mockFeedbackSchedule,
    updatedAt: 'mock',
  }
}

export async function fetchProgramme(): Promise<ProgrammeContent> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('get_programme')

  if (error) throw new Error(error.message)
  return parseProgramme(data as RawProgramme)
}

function audit(
  action: string,
  entityType: string,
  entityId?: string,
  details: Record<string, unknown> = {},
) {
  void logAdminAction(action, entityType, entityId, details).catch(() => {})
}

export async function adminUpsertPhase(payload: {
  id: string
  number: number
  title: string
  subtitle?: string
  dayRange?: string
  description?: string
  milestones?: string[]
  sortOrder?: number
  descriptionByRole?: Partial<Record<RoleFilter, string>>
  milestonesByRole?: Partial<Record<RoleFilter, string[]>>
}): Promise<ProgrammeContent> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_upsert_phase', {
    p_id: payload.id,
    p_number: payload.number,
    p_title: payload.title,
    p_subtitle: payload.subtitle ?? '',
    p_day_range: payload.dayRange ?? '',
    p_description: payload.description ?? '',
    p_milestones: payload.milestones ?? [],
    p_sort_order: payload.sortOrder ?? 0,
    p_description_by_role: payload.descriptionByRole ?? {},
    p_milestones_by_role: payload.milestonesByRole ?? {},
  })
  if (error) throw new Error(error.message)
  audit('upsert', 'phase', payload.id, { title: payload.title })
  return parseProgramme(data as RawProgramme)
}

export async function adminDeletePhase(id: string): Promise<ProgrammeContent> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_delete_phase', { p_id: id })
  if (error) throw new Error(error.message)
  audit('delete', 'phase', id)
  return parseProgramme(data as RawProgramme)
}

export async function adminUpsertSection(payload: {
  id: string
  phaseId: string
  title: string
  subtitle?: string
  sortOrder?: number
}): Promise<ProgrammeContent> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_upsert_section', {
    p_id: payload.id,
    p_phase_id: payload.phaseId,
    p_title: payload.title,
    p_subtitle: payload.subtitle ?? '',
    p_sort_order: payload.sortOrder ?? 0,
  })
  if (error) throw new Error(error.message)
  audit('upsert', 'section', payload.id, { title: payload.title, phaseId: payload.phaseId })
  return parseProgramme(data as RawProgramme)
}

export async function adminDeleteSection(id: string): Promise<ProgrammeContent> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_delete_section', { p_id: id })
  if (error) throw new Error(error.message)
  audit('delete', 'section', id)
  return parseProgramme(data as RawProgramme)
}

export async function adminUpsertTask(payload: {
  id: string
  sectionId: string
  title: string
  whyItMatters?: string
  howTo?: string
  owner: OwnerCode
  roles: RoleFilter[]
  audience?: TaskAudience
  titleHire?: string
  whyItMattersHire?: string
  howToHire?: string
  sortOrder?: number
}): Promise<ProgrammeContent> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_upsert_task', {
    p_id: payload.id,
    p_section_id: payload.sectionId,
    p_title: payload.title,
    p_why_it_matters: payload.whyItMatters ?? null,
    p_how_to: payload.howTo ?? null,
    p_owner: payload.owner,
    p_roles: payload.roles,
    p_audience: payload.audience ?? 'hire',
    p_title_hire: payload.titleHire ?? null,
    p_why_it_matters_hire: payload.whyItMattersHire ?? null,
    p_how_to_hire: payload.howToHire ?? null,
    p_sort_order: payload.sortOrder ?? 0,
  })
  if (error) throw new Error(error.message)
  const result = parseProgramme(data as RawProgramme)
  audit('upsert', 'task', payload.id, { title: payload.title })
  return result
}

export async function adminDeleteTask(
  id: string,
  force = false,
): Promise<ProgrammeContent> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_delete_task', {
    p_id: id,
    p_force: force,
  })
  if (error) throw new Error(error.message)
  audit(force ? 'force_delete' : 'delete', 'task', id)
  return parseProgramme(data as RawProgramme)
}

export async function adminUpsertResource(payload: {
  id: string
  title: string
  description?: string
  category: Resource['category']
  reference?: string
  url?: string
  owner?: OwnerCode
  roles: RoleFilter[]
  sortOrder?: number
}): Promise<ProgrammeContent> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_upsert_resource', {
    p_id: payload.id,
    p_title: payload.title,
    p_description: payload.description ?? '',
    p_category: payload.category,
    p_reference: payload.reference ?? null,
    p_url: payload.url ?? null,
    p_owner: payload.owner ?? null,
    p_roles: payload.roles,
    p_sort_order: payload.sortOrder ?? 0,
  })
  if (error) throw new Error(error.message)
  audit('upsert', 'resource', payload.id, { title: payload.title })
  return parseProgramme(data as RawProgramme)
}

export async function adminDeleteResource(id: string): Promise<ProgrammeContent> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_delete_resource', { p_id: id })
  if (error) throw new Error(error.message)
  audit('delete', 'resource', id)
  return parseProgramme(data as RawProgramme)
}

export async function adminUpsertContact(payload: {
  id: string
  name: string
  role?: string
  ownerCode: OwnerCode
  responsibility?: string
  contactHint?: string
  sortOrder?: number
}): Promise<ProgrammeContent> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_upsert_contact', {
    p_id: payload.id,
    p_name: payload.name,
    p_role: payload.role ?? '',
    p_owner_code: payload.ownerCode,
    p_responsibility: payload.responsibility ?? '',
    p_contact_hint: payload.contactHint ?? '',
    p_sort_order: payload.sortOrder ?? 0,
  })
  if (error) throw new Error(error.message)
  audit('upsert', 'contact', payload.id, { name: payload.name })
  return parseProgramme(data as RawProgramme)
}

export async function adminDeleteContact(id: string): Promise<ProgrammeContent> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_delete_contact', { p_id: id })
  if (error) throw new Error(error.message)
  audit('delete', 'contact', id)
  return parseProgramme(data as RawProgramme)
}

export async function adminUpsertFeedbackItem(payload: {
  id: string
  dayLabel: string
  dayNumber: number
  method?: string
  owner?: string
  sortOrder?: number
}): Promise<ProgrammeContent> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_upsert_feedback_item', {
    p_id: payload.id,
    p_day_label: payload.dayLabel,
    p_day_number: payload.dayNumber,
    p_method: payload.method ?? '',
    p_owner: payload.owner ?? '',
    p_sort_order: payload.sortOrder ?? 0,
  })
  if (error) throw new Error(error.message)
  audit('upsert', 'feedback_item', payload.id, { day: payload.dayLabel })
  return parseProgramme(data as RawProgramme)
}

export async function adminDeleteFeedbackItem(
  id: string,
): Promise<ProgrammeContent> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_delete_feedback_item', {
    p_id: id,
  })
  if (error) throw new Error(error.message)
  audit('delete', 'feedback_item', id)
  return parseProgramme(data as RawProgramme)
}

export async function adminReorderSections(
  phaseId: string,
  sectionIds: string[],
): Promise<ProgrammeContent> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_reorder_sections', {
    p_phase_id: phaseId,
    p_section_ids: sectionIds,
  })
  if (error) throw new Error(error.message)
  audit('reorder', 'sections', phaseId, { sectionIds })
  return parseProgramme(data as RawProgramme)
}

export async function adminReorderTasks(
  sectionId: string,
  taskIds: string[],
): Promise<ProgrammeContent> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_reorder_tasks', {
    p_section_id: sectionId,
    p_task_ids: taskIds,
  })
  if (error) throw new Error(error.message)
  audit('reorder', 'tasks', sectionId, { taskIds })
  return parseProgramme(data as RawProgramme)
}

export async function adminReorderPhases(
  phaseIds: string[],
): Promise<ProgrammeContent> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_reorder_phases', {
    p_phase_ids: phaseIds,
  })
  if (error) throw new Error(error.message)
  audit('reorder', 'phases', undefined, { phaseIds })
  return parseProgramme(data as RawProgramme)
}

export async function adminReorderResources(
  resourceIds: string[],
): Promise<ProgrammeContent> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_reorder_resources', {
    p_resource_ids: resourceIds,
  })
  if (error) throw new Error(error.message)
  audit('reorder', 'resources', undefined, { resourceIds })
  return parseProgramme(data as RawProgramme)
}

export async function adminReorderContacts(
  contactIds: string[],
): Promise<ProgrammeContent> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_reorder_contacts', {
    p_contact_ids: contactIds,
  })
  if (error) throw new Error(error.message)
  audit('reorder', 'contacts', undefined, { contactIds })
  return parseProgramme(data as RawProgramme)
}

export async function adminReorderFeedbackSchedule(
  feedbackIds: string[],
): Promise<ProgrammeContent> {
  const client = requireSupabase()
  const { data, error } = await client.rpc('admin_reorder_feedback_schedule', {
    p_feedback_ids: feedbackIds,
  })
  if (error) throw new Error(error.message)
  audit('reorder', 'feedback_schedule', undefined, { feedbackIds })
  return parseProgramme(data as RawProgramme)
}
