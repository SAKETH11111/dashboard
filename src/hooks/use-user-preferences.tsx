"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react"
import type { SetStateAction } from "react"

import { useLocalStorage } from "@/hooks/use-local-storage"
import type { UserDatasetList, UserPreferences } from "@/types/user-preferences"

export const STORAGE_KEY = "un-climate:user-preferences"
const LEGACY_PINNED_DATASETS_KEY = "climate-pinned-datasets"
const LISTS_MIGRATION_FLAG = "un-climate:lists-migrated"

const DEFAULT_LISTS: ReadonlyArray<UserDatasetList> = [
  { id: "list-arctic-monitoring", name: "Arctic Monitoring", datasetIds: [] },
  { id: "list-forest-coverage", name: "Forest Coverage", datasetIds: [] },
  { id: "list-ocean-health", name: "Ocean Health", datasetIds: [] },
]

const createDefaultLists = (): UserDatasetList[] =>
  DEFAULT_LISTS.map((list) => ({
    ...list,
    datasetIds: [...list.datasetIds],
  }))

export const defaultPreferences: UserPreferences = {
  name: "Sara Ahmed",
  email: "sara.ahmed@example.org",
  city: "Nairobi, KE",
  defaultMetric: "temp",
  units: "metric",
  department: "Department of Economic and Social Affairs",
  lists: createDefaultLists(),
  activeListId: DEFAULT_LISTS[0]?.id ?? null,
}

type UserPreferencesContextValue = {
  preferences: UserPreferences
  setPreferences: React.Dispatch<SetStateAction<UserPreferences>>
  updatePreferences: (updates: Partial<UserPreferences>) => void
}

const UserPreferencesContext = createContext<UserPreferencesContextValue | undefined>(undefined)

function normalizeDatasetIds(datasetIds: unknown): string[] {
  if (!Array.isArray(datasetIds)) return []
  const unique = new Set<string>()
  datasetIds.forEach((value) => {
    if (typeof value === "string" && value.trim().length) {
      unique.add(value)
    }
  })
  return Array.from(unique)
}

function migrateLegacyPinned(): string[] {
  if (typeof window === "undefined") return []
  try {
    if (window.localStorage.getItem(LISTS_MIGRATION_FLAG)) {
      return []
    }
    const stored = window.localStorage.getItem(LEGACY_PINNED_DATASETS_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored) as unknown
    const datasetIds = normalizeDatasetIds(parsed)
    window.localStorage.setItem(LISTS_MIGRATION_FLAG, "1")
    window.localStorage.removeItem(LEGACY_PINNED_DATASETS_KEY)
    return datasetIds
  } catch {
    return []
  }
}

function normalizeLists(lists: unknown): UserDatasetList[] {
  if (!Array.isArray(lists) || lists.length === 0) {
    const legacyDatasetIds = migrateLegacyPinned()
    if (legacyDatasetIds.length) {
      return [
        {
          id: "list-saved-pins",
          name: "Saved Pins",
          datasetIds: legacyDatasetIds,
        },
        ...createDefaultLists(),
      ]
    }
    return createDefaultLists()
  }

  const seenIds = new Set<string>()
  let didChange = false

  const normalized = lists.map((raw, index) => {
    const fallbackId = `list-${index + 1}`
    let id =
      typeof (raw as UserDatasetList).id === "string" && (raw as UserDatasetList).id.trim().length
        ? (raw as UserDatasetList).id
        : fallbackId
    if (seenIds.has(id)) {
      id = `${id}-${index + 1}`
      didChange = true
    }
    seenIds.add(id)

    const nameCandidate = (raw as UserDatasetList).name
    const name =
      typeof nameCandidate === "string" && nameCandidate.trim().length
        ? nameCandidate.trim()
        : `List ${index + 1}`

    const datasetIds = normalizeDatasetIds((raw as UserDatasetList).datasetIds)
    if (
      id !== (raw as UserDatasetList).id ||
      name !== (raw as UserDatasetList).name ||
      datasetIds.length !== ((raw as UserDatasetList).datasetIds?.length ?? 0)
    ) {
      didChange = true
    }

    return { id, name, datasetIds }
  })

  if (!didChange) {
    return lists as UserDatasetList[]
  }

  return normalized
}

function normalizePreferences(preferences: UserPreferences): UserPreferences {
  const lists = normalizeLists(preferences.lists)

  const activeListId =
    typeof preferences.activeListId === "string" &&
    lists.some((list) => list.id === preferences.activeListId)
      ? preferences.activeListId
      : lists[0]?.id ?? null

  const department =
    typeof preferences.department === "string" && preferences.department.trim().length
      ? preferences.department.trim()
      : defaultPreferences.department

  if (
    lists === preferences.lists &&
    activeListId === preferences.activeListId &&
    department === preferences.department
  ) {
    return preferences
  }

  return {
    ...preferences,
    lists,
    activeListId,
    department,
  }
}

function useUserPreferencesValue(): UserPreferencesContextValue {
  const [storedPreferences, setStoredPreferences] = useLocalStorage<UserPreferences>(
    STORAGE_KEY,
    defaultPreferences
  )

  const preferences = useMemo(
    () => normalizePreferences(storedPreferences),
    [storedPreferences]
  )

  useEffect(() => {
    if (preferences !== storedPreferences) {
      setStoredPreferences(preferences)
    }
  }, [preferences, storedPreferences, setStoredPreferences])

  const setPreferences = useCallback(
    (value: SetStateAction<UserPreferences>) => {
      setStoredPreferences((existing) => {
        const current = normalizePreferences(existing)
        const next =
          typeof value === "function"
            ? normalizePreferences((value as (pref: UserPreferences) => UserPreferences)(current))
            : normalizePreferences(value)
        return next
      })
    },
    [setStoredPreferences]
  )

  const updatePreferences = useCallback(
    (updates: Partial<UserPreferences>) => {
      setStoredPreferences((existing) =>
        normalizePreferences({
          ...existing,
          ...updates,
        })
      )
    },
    [setStoredPreferences]
  )

  return { preferences, setPreferences, updatePreferences }
}

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const value = useUserPreferencesValue()

  return <UserPreferencesContext.Provider value={value}>{children}</UserPreferencesContext.Provider>
}

export function useUserPreferences(): UserPreferencesContextValue {
  const context = useContext(UserPreferencesContext)
  if (!context) {
    throw new Error("useUserPreferences must be used within a UserPreferencesProvider")
  }
  return context
}
