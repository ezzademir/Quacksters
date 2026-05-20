import type { FeedbackScheduleItem } from '../types/onboarding'

export interface MilestoneEvent {
  id: string
  dayNumber: number
  label: string
  method: string
  owner: string
  date: Date
  status: 'past' | 'today' | 'upcoming'
}

function addDays(start: Date, days: number): Date {
  const result = new Date(start)
  result.setDate(result.getDate() + days)
  result.setHours(9, 0, 0, 0)
  return result
}

function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

export function getMilestoneEvents(
  startDateIso: string,
  feedbackSchedule: FeedbackScheduleItem[],
): MilestoneEvent[] {
  const start = new Date(startDateIso)
  const today = startOfDay(new Date())

  return feedbackSchedule.map((item) => {
    const dayNumber = item.dayNumber
    const date = addDays(start, dayNumber - 1)
    const dateStart = startOfDay(date)

    let status: MilestoneEvent['status'] = 'upcoming'
    if (dateStart.getTime() === today.getTime()) status = 'today'
    if (dateStart.getTime() < today.getTime()) status = 'past'

    return {
      id: `milestone-${dayNumber}`,
      dayNumber,
      label: item.day,
      method: item.method,
      owner: item.owner,
      date,
      status,
    }
  })
}

export function getNextMilestone(events: MilestoneEvent[]): MilestoneEvent | null {
  return events.find((e) => e.status === 'today' || e.status === 'upcoming') ?? null
}

export function formatMilestoneDate(date: Date): string {
  return date.toLocaleDateString('en-MY', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}
