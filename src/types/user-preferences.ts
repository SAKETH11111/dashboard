export type PreferredMetric =
  | "temp"
  | "co2"
  | "sea-ice"
  | "sea-level"
  | "methane"
  | "enso"
  | "ocean-heat"
  | "electricity-mix"
  | "forest-area"
  | "deforestation-alerts"

export type PreferredUnits = "metric" | "imperial"

export type UserDatasetList = {
  id: string
  name: string
  datasetIds: string[]
}

export type UserPreferences = {
  name: string
  email: string
  city: string
  defaultMetric: PreferredMetric
  units: PreferredUnits
  department: string
  lists: UserDatasetList[]
  activeListId: string | null
}
