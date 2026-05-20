import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
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
} from '../../types/onboarding'
import { useProgrammeContent } from '../../context/ProgrammeContentContext'
import {
  adminDeleteContact,
  adminDeleteFeedbackItem,
  adminDeletePhase,
  adminDeleteResource,
  adminDeleteSection,
  adminDeleteTask,
  adminReorderContacts,
  adminReorderFeedbackSchedule,
  adminReorderPhases,
  adminReorderResources,
  adminReorderSections,
  adminReorderTasks,
  adminUpsertContact,
  adminUpsertFeedbackItem,
  adminUpsertPhase,
  adminUpsertResource,
  adminUpsertSection,
  adminUpsertTask,
} from '../../lib/programmeApi'
import { OutletsEditorTab } from './OutletsEditorTab'

const JOB_ROLES: RoleFilter[] = ['cook', 'cashier', 'supervisor']

const OWNER_CODES: OwnerCode[] = ['EXCO', 'GM', 'SUP', 'HIRE', 'ALL']
const ROLE_FILTERS: RoleFilter[] = ['all', 'cook', 'cashier', 'supervisor']
const RESOURCE_CATEGORIES = ['document', 'training', 'policy', 'contact'] as const

type TabId = 'programme' | 'resources' | 'milestones' | 'contacts' | 'outlets'

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const next = [...items]
  const target = index + direction
  if (target < 0 || target >= next.length) return items
  ;[next[index], next[target]] = [next[target], next[index]]
  return next
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

function inputClass() {
  return 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm'
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ProgrammeEditorPage() {
  const {
    phases,
    resources,
    contacts,
    feedbackSchedule,
    isLoading,
    error,
    applyProgramme,
  } = useProgrammeContent()
  const [tab, setTab] = useState<TabId>('programme')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [expandedPhaseId, setExpandedPhaseId] = useState<string | null>(
    phases[0]?.id ?? null,
  )

  const [phaseModal, setPhaseModal] = useState<OnboardingPhase | null>(null)
  const [sectionModal, setSectionModal] = useState<{
    section: TaskSection
    phaseId: string
  } | null>(null)
  const [taskModal, setTaskModal] = useState<{
    task: OnboardingTask
    sectionId: string
  } | null>(null)
  const [resourceModal, setResourceModal] = useState<Resource | null>(null)
  const [contactModal, setContactModal] = useState<ContactPerson | null>(null)
  const [feedbackModal, setFeedbackModal] = useState<
    (FeedbackScheduleItem & { id?: string }) | null
  >(null)

  async function runSave(action: () => Promise<import('../../lib/programmeApi').ProgrammeContent>) {
    setIsSaving(true)
    setSaveError(null)
    try {
      const next = await action()
      await applyProgramme(next)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteTask(taskId: string, title: string) {
    if (!confirm(`Delete task "${title}"?`)) return
    setIsSaving(true)
    setSaveError(null)
    try {
      const next = await adminDeleteTask(taskId)
      await applyProgramme(next)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed'
      if (message.includes('force delete')) {
        if (
          confirm(
            'This task appears in user progress. Force delete anyway? (Progress references will remain until users sync.)',
          )
        ) {
          try {
            const next = await adminDeleteTask(taskId, true)
            await applyProgramme(next)
            return
          } catch (forceErr) {
            setSaveError(
              forceErr instanceof Error ? forceErr.message : 'Force delete failed',
            )
            return
          }
        }
      }
      setSaveError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'programme', label: 'Programme' },
    { id: 'resources', label: 'Resources' },
    { id: 'milestones', label: 'Milestones' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'outlets', label: 'Outlets' },
  ]

  if (isLoading && !phases.length) {
    return <p className="text-slate-500">Loading programme…</p>
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Programme editor</h2>
      <p className="mt-1 text-slate-600">
        Edit onboarding tasks, resources, and milestones. Changes go live immediately.
      </p>

      {(error || saveError) && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {saveError ?? error}
        </p>
      )}

      <div className="mt-6 flex gap-2 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`border-b-2 px-3 py-2 text-sm font-semibold ${
              tab === t.id
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'programme' && (
        <div className="mt-6 space-y-4">
          <button
            type="button"
            disabled={isSaving}
            onClick={() =>
              setPhaseModal({
                id: newId('phase'),
                number: phases.length,
                title: 'New phase',
                subtitle: '',
                dayRange: '',
                description: '',
                sections: [],
              })
            }
            className="flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add phase
          </button>

          {phases.map((phase, phaseIndex) => {
            const isOpen = expandedPhaseId === phase.id
            return (
              <div
                key={phase.id}
                className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200"
              >
                <div className="flex items-center gap-2 px-4 py-3">
                  <div className="flex shrink-0 flex-col">
                    <button
                      type="button"
                      disabled={isSaving || phaseIndex === 0}
                      onClick={() => {
                        const ids = moveItem(
                          phases.map((p) => p.id),
                          phaseIndex,
                          -1,
                        )
                        void runSave(() => adminReorderPhases(ids))
                      }}
                      className="rounded p-0.5 text-slate-400 hover:bg-slate-50 disabled:opacity-30"
                      title="Move phase up"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isSaving || phaseIndex === phases.length - 1}
                      onClick={() => {
                        const ids = moveItem(
                          phases.map((p) => p.id),
                          phaseIndex,
                          1,
                        )
                        void runSave(() => adminReorderPhases(ids))
                      }}
                      className="rounded p-0.5 text-slate-400 hover:bg-slate-50 disabled:opacity-30"
                      title="Move phase down"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedPhaseId(isOpen ? null : phase.id)
                    }
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    {isOpen ? (
                      <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
                    )}
                    <div>
                      <p className="font-bold text-slate-900">
                        Phase {phase.number}: {phase.title}
                      </p>
                      <p className="text-sm text-slate-500">{phase.dayRange}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhaseModal(phase)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-50"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => {
                      if (!confirm(`Delete phase "${phase.title}"?`)) return
                      void runSave(() => adminDeletePhase(phase.id))
                    }}
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-slate-100 px-4 pb-4">
                    <p className="py-3 text-sm text-slate-600">{phase.description}</p>
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() =>
                        setSectionModal({
                          phaseId: phase.id,
                          section: {
                            id: newId('section'),
                            title: 'New section',
                            tasks: [],
                          },
                        })
                      }
                      className="mb-3 flex items-center gap-1 text-sm font-semibold text-brand-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add section
                    </button>

                    {phase.sections.map((section, sectionIndex) => (
                      <div
                        key={section.id}
                        className="mb-4 rounded-xl border border-slate-100 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 flex-1 items-start gap-2">
                            <div className="flex shrink-0 flex-col">
                              <button
                                type="button"
                                disabled={isSaving || sectionIndex === 0}
                                onClick={() => {
                                  const ids = moveItem(
                                    phase.sections.map((s) => s.id),
                                    sectionIndex,
                                    -1,
                                  )
                                  void runSave(() =>
                                    adminReorderSections(phase.id, ids),
                                  )
                                }}
                                className="rounded p-0.5 text-slate-400 hover:bg-slate-50 disabled:opacity-30"
                                title="Move section up"
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={
                                  isSaving ||
                                  sectionIndex === phase.sections.length - 1
                                }
                                onClick={() => {
                                  const ids = moveItem(
                                    phase.sections.map((s) => s.id),
                                    sectionIndex,
                                    1,
                                  )
                                  void runSave(() =>
                                    adminReorderSections(phase.id, ids),
                                  )
                                }}
                                className="rounded p-0.5 text-slate-400 hover:bg-slate-50 disabled:opacity-30"
                                title="Move section down"
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">
                                {section.title}
                              </p>
                              {section.subtitle && (
                                <p className="text-xs text-slate-500">
                                  {section.subtitle}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setSectionModal({ section, phaseId: phase.id })
                              }
                              className="rounded p-1.5 text-slate-500 hover:bg-slate-50"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => {
                                if (!confirm(`Delete section "${section.title}"?`))
                                  return
                                void runSave(() => adminDeleteSection(section.id))
                              }}
                              className="rounded p-1.5 text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <ul className="mt-2 space-y-1">
                          {section.tasks.map((task, taskIndex) => (
                            <li
                              key={task.id}
                              className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                            >
                              <div className="flex min-w-0 flex-1 items-center gap-2">
                                <div className="flex shrink-0 flex-col">
                                  <button
                                    type="button"
                                    disabled={isSaving || taskIndex === 0}
                                    onClick={() => {
                                      const ids = moveItem(
                                        section.tasks.map((t) => t.id),
                                        taskIndex,
                                        -1,
                                      )
                                      void runSave(() =>
                                        adminReorderTasks(section.id, ids),
                                      )
                                    }}
                                    className="rounded p-0.5 text-slate-400 hover:bg-white disabled:opacity-30"
                                    title="Move task up"
                                  >
                                    <ChevronUp className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={
                                      isSaving ||
                                      taskIndex === section.tasks.length - 1
                                    }
                                    onClick={() => {
                                      const ids = moveItem(
                                        section.tasks.map((t) => t.id),
                                        taskIndex,
                                        1,
                                      )
                                      void runSave(() =>
                                        adminReorderTasks(section.id, ids),
                                      )
                                    }}
                                    className="rounded p-0.5 text-slate-400 hover:bg-white disabled:opacity-30"
                                    title="Move task down"
                                  >
                                    <ChevronDown className="h-3 w-3" />
                                  </button>
                                </div>
                                <span className="min-w-0 truncate text-slate-800">
                                  {task.title}
                                  <span className="ml-2 text-xs text-slate-400">
                                    {task.owner} · {task.audience ?? 'hire'}
                                  </span>
                                </span>
                              </div>
                              <div className="flex shrink-0 gap-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setTaskModal({ task, sectionId: section.id })
                                  }
                                  className="rounded p-1 text-slate-500 hover:bg-white"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() => void handleDeleteTask(task.id, task.title)}
                                  className="rounded p-1 text-red-500 hover:bg-white"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>

                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() =>
                            setTaskModal({
                              sectionId: section.id,
                              task: {
                                id: newId('task'),
                                title: 'New task',
                                owner: 'SUP',
                                roles: ['all'],
                                audience: 'hire',
                              },
                            })
                          }
                          className="mt-2 flex items-center gap-1 text-xs font-semibold text-brand-700"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add task
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'resources' && (
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() =>
              setResourceModal({
                id: newId('resource'),
                title: 'New resource',
                description: '',
                category: 'document',
                roles: ['all'],
              })
            }
            className="flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Add resource
          </button>
          {resources.map((r, ri) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-xl bg-white p-4 ring-1 ring-slate-200"
            >
              <div className="flex min-w-0 flex-1 items-start gap-2">
                <div className="flex shrink-0 flex-col pt-1">
                  <button
                    type="button"
                    disabled={isSaving || ri === 0}
                    onClick={() => {
                      const ids = moveItem(
                        resources.map((x) => x.id),
                        ri,
                        -1,
                      )
                      void runSave(() => adminReorderResources(ids))
                    }}
                    className="rounded p-0.5 text-slate-400 hover:bg-slate-50 disabled:opacity-30"
                    title="Move up"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isSaving || ri === resources.length - 1}
                    onClick={() => {
                      const ids = moveItem(
                        resources.map((x) => x.id),
                        ri,
                        1,
                      )
                      void runSave(() => adminReorderResources(ids))
                    }}
                    className="rounded p-0.5 text-slate-400 hover:bg-slate-50 disabled:opacity-30"
                    title="Move down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{r.title}</p>
                  <p className="text-sm text-slate-500">{r.description}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => setResourceModal(r)}>
                  <Pencil className="h-4 w-4 text-slate-500" />
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    if (!confirm(`Delete resource "${r.title}"?`)) return
                    void runSave(() => adminDeleteResource(r.id))
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'milestones' && (
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() =>
              setFeedbackModal({
                id: newId('fb'),
                day: 'Day 0',
                dayNumber: 0,
                method: '',
                owner: 'SUP',
              })
            }
            className="flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Add milestone
          </button>
          {feedbackSchedule.map((f, fi) => {
            const fid = f.id ?? `fb-${f.dayNumber}`
            return (
              <div
                key={fid}
                className="flex items-center justify-between rounded-xl bg-white p-4 ring-1 ring-slate-200"
              >
                <div className="flex min-w-0 flex-1 items-start gap-2">
                  <div className="flex shrink-0 flex-col pt-1">
                    <button
                      type="button"
                      disabled={isSaving || fi === 0}
                      onClick={() => {
                        const ids = moveItem(
                          feedbackSchedule.map(
                            (x) => x.id ?? `fb-${x.dayNumber}`,
                          ),
                          fi,
                          -1,
                        )
                        void runSave(() =>
                          adminReorderFeedbackSchedule(ids),
                        )
                      }}
                      className="rounded p-0.5 text-slate-400 hover:bg-slate-50 disabled:opacity-30"
                      title="Move up"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={isSaving || fi === feedbackSchedule.length - 1}
                      onClick={() => {
                        const ids = moveItem(
                          feedbackSchedule.map(
                            (x) => x.id ?? `fb-${x.dayNumber}`,
                          ),
                          fi,
                          1,
                        )
                        void runSave(() =>
                          adminReorderFeedbackSchedule(ids),
                        )
                      }}
                      className="rounded p-0.5 text-slate-400 hover:bg-slate-50 disabled:opacity-30"
                      title="Move down"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{f.day}</p>
                    <p className="text-sm text-slate-500">
                      {f.method} · {f.owner}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setFeedbackModal({
                      ...f,
                      id: f.id ?? `fb-${f.dayNumber}`,
                    })
                  }
                >
                  <Pencil className="h-4 w-4 text-slate-500" />
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    void runSave(() =>
                      adminDeleteFeedbackItem(f.id ?? `fb-${f.dayNumber}`),
                    )
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
            )
          })}
        </div>
      )}

      {tab === 'contacts' && (
        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={() =>
              setContactModal({
                id: newId('contact'),
                name: 'New contact',
                role: '',
                ownerCode: 'SUP',
                responsibility: '',
                contactHint: '',
              })
            }
            className="flex items-center gap-2 rounded-xl bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Add contact
          </button>
          {contacts.map((c, ci) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-xl bg-white p-4 ring-1 ring-slate-200"
            >
              <div className="flex min-w-0 flex-1 items-start gap-2">
                <div className="flex shrink-0 flex-col pt-1">
                  <button
                    type="button"
                    disabled={isSaving || ci === 0}
                    onClick={() => {
                      const ids = moveItem(
                        contacts.map((x) => x.id),
                        ci,
                        -1,
                      )
                      void runSave(() => adminReorderContacts(ids))
                    }}
                    className="rounded p-0.5 text-slate-400 hover:bg-slate-50 disabled:opacity-30"
                    title="Move up"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={isSaving || ci === contacts.length - 1}
                    onClick={() => {
                      const ids = moveItem(
                        contacts.map((x) => x.id),
                        ci,
                        1,
                      )
                      void runSave(() => adminReorderContacts(ids))
                    }}
                    className="rounded p-0.5 text-slate-400 hover:bg-slate-50 disabled:opacity-30"
                    title="Move down"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-sm text-slate-500">{c.responsibility}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <button type="button" onClick={() => setContactModal(c)}>
                  <Pencil className="h-4 w-4 text-slate-500" />
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => {
                    if (!confirm(`Delete contact "${c.name}"?`)) return
                    void runSave(() => adminDeleteContact(c.id))
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'outlets' && <OutletsEditorTab />}

      {phaseModal && (
        <PhaseEditModal
          phase={phaseModal}
          sortOrder={phases.findIndex((p) => p.id === phaseModal.id)}
          isSaving={isSaving}
          onClose={() => setPhaseModal(null)}
          onSave={(payload) =>
            runSave(() => adminUpsertPhase(payload)).then(() =>
              setPhaseModal(null),
            )
          }
        />
      )}

      {sectionModal && (
        <SectionEditModal
          section={sectionModal.section}
          isSaving={isSaving}
          onClose={() => setSectionModal(null)}
          onSave={(payload) =>
            runSave(() =>
              adminUpsertSection({
                ...payload,
                phaseId: sectionModal.phaseId,
              }),
            ).then(() => setSectionModal(null))
          }
        />
      )}

      {taskModal && (
        <TaskEditModal
          task={taskModal.task}
          isSaving={isSaving}
          onClose={() => setTaskModal(null)}
          onSave={(payload) =>
            runSave(() =>
              adminUpsertTask({
                ...payload,
                sectionId: taskModal.sectionId,
              }),
            ).then(() => setTaskModal(null))
          }
        />
      )}

      {resourceModal && (
        <ResourceEditModal
          resource={resourceModal}
          sortOrder={resources.findIndex((r) => r.id === resourceModal.id)}
          isSaving={isSaving}
          onClose={() => setResourceModal(null)}
          onSave={(payload) =>
            runSave(() => adminUpsertResource(payload)).then(() =>
              setResourceModal(null),
            )
          }
        />
      )}

      {contactModal && (
        <ContactEditModal
          contact={contactModal}
          sortOrder={contacts.findIndex((c) => c.id === contactModal.id)}
          isSaving={isSaving}
          onClose={() => setContactModal(null)}
          onSave={(payload) =>
            runSave(() => adminUpsertContact(payload)).then(() =>
              setContactModal(null),
            )
          }
        />
      )}

      {feedbackModal && (
        <FeedbackEditModal
          item={feedbackModal}
          sortOrder={feedbackSchedule.findIndex(
            (f) => f.dayNumber === feedbackModal.dayNumber,
          )}
          isSaving={isSaving}
          onClose={() => setFeedbackModal(null)}
          onSave={(payload) =>
            runSave(() => adminUpsertFeedbackItem(payload)).then(() =>
              setFeedbackModal(null),
            )
          }
        />
      )}
    </div>
  )
}

function PhaseEditModal({
  phase,
  sortOrder,
  isSaving,
  onClose,
  onSave,
}: {
  phase: OnboardingPhase
  sortOrder: number
  isSaving: boolean
  onClose: () => void
  onSave: (payload: Parameters<typeof adminUpsertPhase>[0]) => void
}) {
  const [form, setForm] = useState(phase)

  return (
    <Modal title="Edit phase" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          onSave({
            id: form.id,
            number: form.number,
            title: form.title,
            subtitle: form.subtitle,
            dayRange: form.dayRange,
            description: form.description,
            milestones: form.milestones ?? [],
            sortOrder: sortOrder >= 0 ? sortOrder : 0,
            descriptionByRole: form.descriptionByRole,
            milestonesByRole: form.milestonesByRole,
          })
        }}
      >
        <Field label="Title">
          <input
            className={inputClass()}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </Field>
        <Field label="Number">
          <input
            type="number"
            className={inputClass()}
            value={form.number}
            onChange={(e) =>
              setForm({ ...form, number: Number(e.target.value) })
            }
          />
        </Field>
        <Field label="Subtitle">
          <input
            className={inputClass()}
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
          />
        </Field>
        <Field label="Day range">
          <input
            className={inputClass()}
            value={form.dayRange}
            onChange={(e) => setForm({ ...form, dayRange: e.target.value })}
          />
        </Field>
        <Field label="Description">
          <textarea
            className={inputClass()}
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <Field label="Default milestones (one per line)">
          <textarea
            className={inputClass()}
            rows={3}
            value={(form.milestones ?? []).join('\n')}
            onChange={(e) =>
              setForm({
                ...form,
                milestones: e.target.value
                  .split('\n')
                  .map((line) => line.trim())
                  .filter(Boolean),
              })
            }
          />
        </Field>
        <div className="rounded-xl border border-slate-100 p-3">
          <p className="mb-2 text-sm font-semibold text-slate-700">
            Role-specific copy (optional)
          </p>
          {JOB_ROLES.map((role) => (
            <div key={role} className="mb-3 space-y-2 border-t border-slate-100 pt-3 first:border-0 first:pt-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {role}
              </p>
              <Field label="Description override">
                <textarea
                  className={inputClass()}
                  rows={2}
                  value={form.descriptionByRole?.[role] ?? ''}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      descriptionByRole: {
                        ...form.descriptionByRole,
                        [role]: e.target.value || undefined,
                      },
                    })
                  }
                />
              </Field>
              <Field label="Milestones override (one per line)">
                <textarea
                  className={inputClass()}
                  rows={2}
                  value={(form.milestonesByRole?.[role] ?? []).join('\n')}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      milestonesByRole: {
                        ...form.milestonesByRole,
                        [role]: e.target.value
                          .split('\n')
                          .map((line) => line.trim())
                          .filter(Boolean),
                      },
                    })
                  }
                />
              </Field>
            </div>
          ))}
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Save phase
        </button>
      </form>
    </Modal>
  )
}

function SectionEditModal({
  section,
  isSaving,
  onClose,
  onSave,
}: {
  section: TaskSection
  isSaving: boolean
  onClose: () => void
  onSave: (payload: Omit<Parameters<typeof adminUpsertSection>[0], 'phaseId'>) => void
}) {
  const [form, setForm] = useState(section)

  return (
    <Modal title="Edit section" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          onSave({
            id: form.id,
            title: form.title,
            subtitle: form.subtitle ?? '',
          })
        }}
      >
        <Field label="Title">
          <input
            className={inputClass()}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </Field>
        <Field label="Subtitle">
          <input
            className={inputClass()}
            value={form.subtitle ?? ''}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
          />
        </Field>
        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Save section
        </button>
      </form>
    </Modal>
  )
}

function TaskEditModal({
  task,
  isSaving,
  onClose,
  onSave,
}: {
  task: OnboardingTask
  isSaving: boolean
  onClose: () => void
  onSave: (payload: Omit<Parameters<typeof adminUpsertTask>[0], 'sectionId'>) => void
}) {
  const [form, setForm] = useState(task)

  function toggleRole(role: RoleFilter) {
    const roles = form.roles.includes(role)
      ? form.roles.filter((r) => r !== role)
      : [...form.roles, role]
    setForm({ ...form, roles: roles.length ? roles : ['all'] })
  }

  return (
    <Modal title="Edit task" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          onSave({
            id: form.id,
            title: form.title,
            whyItMatters: form.whyItMatters,
            howTo: form.howTo,
            owner: form.owner,
            roles: form.roles,
            audience: form.audience,
            titleHire: form.titleHire,
            whyItMattersHire: form.whyItMattersHire,
            howToHire: form.howToHire,
          })
        }}
      >
        <Field label="Title (internal)">
          <input
            className={inputClass()}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </Field>
        <Field label="Title (hire app)">
          <input
            className={inputClass()}
            value={form.titleHire ?? ''}
            onChange={(e) => setForm({ ...form, titleHire: e.target.value })}
          />
        </Field>
        <Field label="Owner">
          <select
            className={inputClass()}
            value={form.owner}
            onChange={(e) =>
              setForm({ ...form, owner: e.target.value as OwnerCode })
            }
          >
            {OWNER_CODES.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Audience">
          <select
            className={inputClass()}
            value={form.audience ?? 'hire'}
            onChange={(e) =>
              setForm({ ...form, audience: e.target.value as TaskAudience })
            }
          >
            <option value="hire">hire</option>
            <option value="internal">internal</option>
          </select>
        </Field>
        <Field label="Roles">
          <div className="flex flex-wrap gap-2">
            {ROLE_FILTERS.map((role) => (
              <label key={role} className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={form.roles.includes(role)}
                  onChange={() => toggleRole(role)}
                />
                {role}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Why it matters">
          <textarea
            className={inputClass()}
            rows={2}
            value={form.whyItMatters ?? ''}
            onChange={(e) => setForm({ ...form, whyItMatters: e.target.value })}
          />
        </Field>
        <Field label="How to">
          <textarea
            className={inputClass()}
            rows={2}
            value={form.howTo ?? ''}
            onChange={(e) => setForm({ ...form, howTo: e.target.value })}
          />
        </Field>
        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Save task
        </button>
      </form>
    </Modal>
  )
}

function ResourceEditModal({
  resource,
  sortOrder,
  isSaving,
  onClose,
  onSave,
}: {
  resource: Resource
  sortOrder: number
  isSaving: boolean
  onClose: () => void
  onSave: (payload: Parameters<typeof adminUpsertResource>[0]) => void
}) {
  const [form, setForm] = useState(resource)

  return (
    <Modal title="Edit resource" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          onSave({
            id: form.id,
            title: form.title,
            description: form.description,
            category: form.category,
            reference: form.reference,
            url: form.url,
            owner: form.owner,
            roles: form.roles,
            sortOrder: sortOrder >= 0 ? sortOrder : 0,
          })
        }}
      >
        <Field label="Title">
          <input
            className={inputClass()}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </Field>
        <Field label="Description">
          <textarea
            className={inputClass()}
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <Field label="Category">
          <select
            className={inputClass()}
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value as Resource['category'],
              })
            }
          >
            {RESOURCE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="URL">
          <input
            className={inputClass()}
            value={form.url ?? ''}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
        </Field>
        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Save resource
        </button>
      </form>
    </Modal>
  )
}

function ContactEditModal({
  contact,
  sortOrder,
  isSaving,
  onClose,
  onSave,
}: {
  contact: ContactPerson
  sortOrder: number
  isSaving: boolean
  onClose: () => void
  onSave: (payload: Parameters<typeof adminUpsertContact>[0]) => void
}) {
  const [form, setForm] = useState(contact)

  return (
    <Modal title="Edit contact" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          onSave({
            id: form.id,
            name: form.name,
            role: form.role,
            ownerCode: form.ownerCode,
            responsibility: form.responsibility,
            contactHint: form.contactHint,
            sortOrder: sortOrder >= 0 ? sortOrder : 0,
          })
        }}
      >
        <Field label="Name">
          <input
            className={inputClass()}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </Field>
        <Field label="Responsibility">
          <textarea
            className={inputClass()}
            rows={2}
            value={form.responsibility}
            onChange={(e) =>
              setForm({ ...form, responsibility: e.target.value })
            }
          />
        </Field>
        <Field label="Contact hint">
          <input
            className={inputClass()}
            value={form.contactHint}
            onChange={(e) => setForm({ ...form, contactHint: e.target.value })}
          />
        </Field>
        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Save contact
        </button>
      </form>
    </Modal>
  )
}

function FeedbackEditModal({
  item,
  sortOrder,
  isSaving,
  onClose,
  onSave,
}: {
  item: FeedbackScheduleItem & { id?: string }
  sortOrder: number
  isSaving: boolean
  onClose: () => void
  onSave: (payload: Parameters<typeof adminUpsertFeedbackItem>[0]) => void
}) {
  const [form, setForm] = useState(item)

  return (
    <Modal title="Edit milestone" onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          onSave({
            id: form.id ?? `fb-${form.dayNumber}`,
            dayLabel: form.day,
            dayNumber: form.dayNumber,
            method: form.method,
            owner: form.owner,
            sortOrder: sortOrder >= 0 ? sortOrder : 0,
          })
        }}
      >
        <Field label="Day label">
          <input
            className={inputClass()}
            value={form.day}
            onChange={(e) => setForm({ ...form, day: e.target.value })}
          />
        </Field>
        <Field label="Day number">
          <input
            type="number"
            className={inputClass()}
            value={form.dayNumber}
            onChange={(e) =>
              setForm({ ...form, dayNumber: Number(e.target.value) })
            }
          />
        </Field>
        <Field label="Method">
          <input
            className={inputClass()}
            value={form.method}
            onChange={(e) => setForm({ ...form, method: e.target.value })}
          />
        </Field>
        <Field label="Owner">
          <input
            className={inputClass()}
            value={form.owner}
            onChange={(e) => setForm({ ...form, owner: e.target.value })}
          />
        </Field>
        <button
          type="submit"
          disabled={isSaving}
          className="w-full rounded-xl bg-brand-700 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          Save milestone
        </button>
      </form>
    </Modal>
  )
}
