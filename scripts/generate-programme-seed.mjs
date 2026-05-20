/**
 * Generates supabase/migrations/*_programme_seed.sql from src/data/mockData.ts
 * Run: node scripts/generate-programme-seed.mjs
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  onboardingPhases,
  resources,
  contacts,
  feedbackSchedule,
} from '../src/data/mockData.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = join(
  __dirname,
  '../supabase/migrations/20260519140100_programme_seed.sql',
)

function esc(s) {
  if (s == null) return 'NULL'
  return `'${String(s).replace(/'/g, "''")}'`
}

function escArray(arr) {
  if (!arr?.length) return "'{all}'"
  const inner = arr.map((v) => `"${v}"`).join(',')
  return `'{${inner}}'`
}

function escJson(arr) {
  if (!arr?.length) return "'[]'::jsonb"
  return `'${JSON.stringify(arr).replace(/'/g, "''")}'::jsonb`
}

const lines = [
  '-- Seed programme content from mockData.ts (generated — do not hand-edit)',
  '',
  'TRUNCATE public.onboarding_phase_role_copy, public.onboarding_tasks, public.onboarding_sections, public.onboarding_phases, public.onboarding_resources, public.onboarding_contacts, public.onboarding_feedback_schedule CASCADE;',
  '',
]

let phaseOrder = 0
for (const phase of onboardingPhases) {
  lines.push(
    `INSERT INTO public.onboarding_phases (id, number, title, subtitle, day_range, description, milestones, sort_order) VALUES (${esc(phase.id)}, ${phase.number}, ${esc(phase.title)}, ${esc(phase.subtitle)}, ${esc(phase.dayRange)}, ${esc(phase.description)}, ${escJson(phase.milestones ?? [])}, ${phaseOrder++});`,
  )

  if (phase.descriptionByRole) {
    for (const [role, desc] of Object.entries(phase.descriptionByRole)) {
      const milestones = phase.milestonesByRole?.[role] ?? []
      lines.push(
        `INSERT INTO public.onboarding_phase_role_copy (phase_id, role, description, milestones) VALUES (${esc(phase.id)}, ${esc(role)}, ${esc(desc)}, ${escJson(milestones)});`,
      )
    }
  }

  let sectionOrder = 0
  for (const section of phase.sections) {
    lines.push(
      `INSERT INTO public.onboarding_sections (id, phase_id, title, subtitle, sort_order) VALUES (${esc(section.id)}, ${esc(phase.id)}, ${esc(section.title)}, ${esc(section.subtitle ?? '')}, ${sectionOrder++});`,
    )

    let taskOrder = 0
    for (const task of section.tasks) {
      lines.push(
        `INSERT INTO public.onboarding_tasks (id, section_id, title, why_it_matters, how_to, owner, roles, audience, title_hire, why_it_matters_hire, how_to_hire, sort_order) VALUES (${esc(task.id)}, ${esc(section.id)}, ${esc(task.title)}, ${esc(task.whyItMatters ?? null)}, ${esc(task.howTo ?? null)}, ${esc(task.owner)}, ${escArray(task.roles)}, ${esc(task.audience ?? 'hire')}, ${esc(task.titleHire ?? null)}, ${esc(task.whyItMattersHire ?? null)}, ${esc(task.howToHire ?? null)}, ${taskOrder++});`,
      )
    }
  }
  lines.push('')
}

let resourceOrder = 0
for (const r of resources) {
  lines.push(
    `INSERT INTO public.onboarding_resources (id, title, description, category, reference, url, owner, roles, sort_order) VALUES (${esc(r.id)}, ${esc(r.title)}, ${esc(r.description)}, ${esc(r.category)}, ${esc(r.reference ?? null)}, ${esc(r.url ?? null)}, ${esc(r.owner ?? null)}, ${escArray(r.roles)}, ${resourceOrder++});`,
  )
}
lines.push('')

let contactOrder = 0
for (const c of contacts) {
  lines.push(
    `INSERT INTO public.onboarding_contacts (id, name, role, owner_code, responsibility, contact_hint, sort_order) VALUES (${esc(c.id)}, ${esc(c.name)}, ${esc(c.role)}, ${esc(c.ownerCode)}, ${esc(c.responsibility)}, ${esc(c.contactHint)}, ${contactOrder++});`,
  )
}
lines.push('')

let feedbackOrder = 0
for (const f of feedbackSchedule) {
  lines.push(
    `INSERT INTO public.onboarding_feedback_schedule (id, day_label, day_number, method, owner, sort_order) VALUES (${esc(`fb-${f.dayNumber}`)}, ${esc(f.day)}, ${f.dayNumber}, ${esc(f.method)}, ${esc(f.owner)}, ${feedbackOrder++});`,
  )
}

writeFileSync(outPath, lines.join('\n') + '\n')
console.log(`Wrote ${outPath} (${lines.length} lines)`)
