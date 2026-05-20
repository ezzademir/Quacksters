import {
  BookOpen,
  Calendar,
  ExternalLink,
  FileText,
  MessageCircle,
  Shield,
  Users,
} from 'lucide-react'
import { ownerColors } from '../../data/mockData'
import { useOnboarding } from '../../context/OnboardingContext'
import { useProgrammeContent } from '../../context/ProgrammeContentContext'
import { openExternalUrl } from '../../lib/openUrl'
import { Header } from '../layout/Header'
import type { Resource, ResourceCategory } from '../../types/onboarding'

const categoryConfig: Record<
  ResourceCategory,
  { label: string; icon: typeof FileText; color: string }
> = {
  document: { label: 'Documents', icon: FileText, color: 'bg-blue-50 text-blue-600' },
  training: { label: 'Training', icon: BookOpen, color: 'bg-emerald-50 text-emerald-600' },
  policy: { label: 'Policies', icon: Shield, color: 'bg-violet-50 text-violet-600' },
  contact: { label: 'Contacts', icon: Users, color: 'bg-amber-50 text-amber-600' },
}

function ResourceCard({ resource }: { resource: Resource }) {
  const config = categoryConfig[resource.category]
  const Icon = config.icon
  const isClickable = Boolean(resource.url)

  const content = (
    <div className="flex gap-3">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${config.color}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-slate-900">{resource.title}</p>
        <p className="mt-0.5 text-sm text-slate-500">{resource.description}</p>
        {resource.reference && (
          <p className="mt-2 inline-flex items-center gap-1 rounded-lg bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
            <ExternalLink className="h-3 w-3" />
            {resource.reference}
          </p>
        )}
        {isClickable && (
          <p className="mt-2 text-xs font-semibold text-brand-600">Tap to open</p>
        )}
      </div>
    </div>
  )

  if (!isClickable) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        {content}
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => void openExternalUrl(resource.url!)}
      className="w-full rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm active:bg-slate-50"
    >
      {content}
    </button>
  )
}

export function ResourcesView() {
  const { roleLabel, relevantResources } = useOnboarding()
  const { contacts, feedbackSchedule } = useProgrammeContent()

  const grouped = relevantResources.reduce<Record<ResourceCategory, Resource[]>>(
    (acc, resource) => {
      acc[resource.category] = acc[resource.category] ?? []
      acc[resource.category].push(resource)
      return acc
    },
    {} as Record<ResourceCategory, Resource[]>,
  )

  return (
    <>
      <Header
        title="Resources"
        subtitle={`SOPs and guides for your ${roleLabel.toLowerCase()} role`}
      />

      <div className="space-y-8 px-4 py-4">
        {relevantResources.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-500 ring-1 ring-slate-200">
            No resources are assigned to your role yet.
          </p>
        ) : (
          (Object.keys(grouped) as ResourceCategory[]).map((category) => {
            const config = categoryConfig[category]
            return (
              <section key={category}>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                  {config.label}
                </h2>
                <div className="space-y-3">
                  {grouped[category].map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
                </div>
              </section>
            )
          })
        )}

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            <Users className="h-4 w-4" />
            Key contacts
          </h2>
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{contact.name}</p>
                    <p className="text-sm text-slate-500">{contact.responsibility}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${ownerColors[contact.ownerCode]}`}
                  >
                    {contact.ownerCode}
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {contact.contactHint}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
            <Calendar className="h-4 w-4" />
            Feedback schedule
          </h2>
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            {feedbackSchedule.map((item, i) => (
              <div
                key={item.day}
                className={`flex items-center justify-between px-4 py-3 ${
                  i > 0 ? 'border-t border-slate-50' : ''
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.day}</p>
                  <p className="text-xs text-slate-500">{item.method}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${ownerColors[item.owner.split(' ')[0] as keyof typeof ownerColors] ?? ownerColors.ALL}`}
                >
                  {item.owner}
                </span>
              </div>
            ))}
          </div>
        </section>

        <p className="pb-4 text-center text-xs text-slate-400">
          QT-HR-OPS-001 v1.0 · QT-SOP-OPS-002 v3.0 · Confidential
        </p>
      </div>
    </>
  )
}
