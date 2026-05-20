export const STORAGE_KEYS = {
  progress: 'quackteow-onboarding-progress',
  profile: 'quackteow-user-profile',
} as const

export async function getStoredJson<T>(key: string): Promise<T | null> {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor.isNativePlatform()) {
      const { Preferences } = await import('@capacitor/preferences')
      const { value } = await Preferences.get({ key })
      return value ? (JSON.parse(value) as T) : null
    }
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export async function setStoredJson<T>(key: string, value: T): Promise<void> {
  const payload = JSON.stringify(value)
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor.isNativePlatform()) {
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.set({ key, value: payload })
      return
    }
    localStorage.setItem(key, payload)
  } catch {
    localStorage.setItem(key, payload)
  }
}

export async function removeStored(key: string): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor.isNativePlatform()) {
      const { Preferences } = await import('@capacitor/preferences')
      await Preferences.remove({ key })
      return
    }
    localStorage.removeItem(key)
  } catch {
    localStorage.removeItem(key)
  }
}
