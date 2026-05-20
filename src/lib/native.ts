import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'
import { getMockProgramme } from './programmeApi'
import { getMilestoneEvents } from './milestones'
import type { FeedbackScheduleItem, UserProfile } from '../types/onboarding'

type BackHandler = () => boolean

let backHandler: BackHandler | null = null

export function setAndroidBackHandler(handler: BackHandler | null) {
  backHandler = handler
}

export async function initNativeShell(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  try {
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#FFC700' })
  } catch {
    // Status bar unavailable on some platforms
  }

  try {
    await SplashScreen.hide()
  } catch {
    // Splash already hidden
  }

  App.addListener('backButton', ({ canGoBack }) => {
    if (backHandler?.()) return
    if (!canGoBack) {
      App.exitApp()
    }
  })
}

export async function scheduleMilestoneNotifications(
  profile: UserProfile,
  feedbackSchedule: FeedbackScheduleItem[] = getMockProgramme().feedbackSchedule,
): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const permission = await LocalNotifications.requestPermissions()
    if (permission.display !== 'granted') return

    const events = getMilestoneEvents(profile.startDate, feedbackSchedule)
    const now = Date.now()

    const notifications = events
      .filter((event) => event.date.getTime() > now)
      .map((event) => ({
        id: event.dayNumber,
        title: `Quacksters · ${event.label}`,
        body: `${event.method} with ${event.owner}`,
        schedule: { at: event.date },
        smallIcon: 'ic_launcher_foreground',
        iconColor: '#FFC700',
      }))

    if (notifications.length === 0) return

    await LocalNotifications.schedule({ notifications })
  } catch {
    // Notifications optional
  }
}

export async function triggerTaskHaptic(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch {
    // Haptics unavailable
  }
}
