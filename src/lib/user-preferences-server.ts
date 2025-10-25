import { cookies } from "next/headers"

import { STORAGE_KEY, defaultPreferences } from "@/hooks/use-user-preferences"
import type { UserPreferences } from "@/types/user-preferences"

export async function getStoredPreferences(): Promise<UserPreferences> {
  const cookieStore = await cookies()
  const stored = cookieStore.get(STORAGE_KEY)
  if (!stored?.value) {
    return defaultPreferences
  }
  try {
    return JSON.parse(stored.value) as UserPreferences
  } catch (error) {
    console.error("Failed to parse stored preferences", error)
    return defaultPreferences
  }
}

