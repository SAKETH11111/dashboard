export type DatasetFrequency = "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Annual"
export type DatasetDomain =
  | "Drinking Water"
  | "Recreational Water"
  | "Emerging Contaminants"
  | "Infrastructure"
export type DatasetCategory = "monitor" | "annual" | "index"

export interface DatasetDefinition {
  id: string
  title: string
  provider: string
  frequency: DatasetFrequency
  domain: DatasetDomain
  unit: string
  endpoint: string
  downloadUrl?: string
  description: string
  metricKey?:
    | "nitrate"
    | "nitrite"
    | "ecoli"
    | "pfas"
    | "arsenic"
    | "dbp"
    | "fluoride"
    | "advisories"
  status?: "available" | "coming-soon"
  category: DatasetCategory
  notes?: string
  lastUpdatedHint?: string
}

export const climateDatasets: DatasetDefinition[] = [
  {
    id: "iowa_nitrate_source_water",
    title: "Nitrate Compliance Sampling",
    provider: "Iowa DNR Source Water Program",
    frequency: "Monthly",
    domain: "Drinking Water",
    unit: "mg/L",
    endpoint: "/api/water/nitrate",
    description:
      "Most recent nitrate results submitted by public water systems. Includes running averages compared to the 10 mg/L MCL.",
    metricKey: "nitrate",
    category: "monitor",
    notes: "Initial release uses cached JSON from scripts/water-etl; live API integration planned.",
    lastUpdatedHint: "Updated weekly as utilities upload compliance samples.",
  },
  {
    id: "iowa_beach_ecoli",
    title: "Recreational Beach E. coli",
    provider: "Iowa DNR Beach Monitoring",
    frequency: "Weekly",
    domain: "Recreational Water",
    unit: "MPN/100mL",
    endpoint: "/api/water/bacteria?type=ecoli",
    description:
      "Seasonal monitoring of E. coli at state beaches with swim advisories when counts exceed EPA thresholds.",
    metricKey: "ecoli",
    category: "monitor",
    lastUpdatedHint: "Updated weekly May–September.",
  },
  {
    id: "iowa_pfas_dashboard",
    title: "PFAS Monitoring Results",
    provider: "Iowa DNR PFAS Survey",
    frequency: "Quarterly",
    domain: "Emerging Contaminants",
    unit: "ppt",
    endpoint: "/api/water/pfas",
    description:
      "Per- and polyfluoroalkyl substances detections from Iowa DNR sampling and utility self-reports, benchmarked to the 4 ppt EPA MCL.",
    metricKey: "pfas",
    category: "monitor",
    status: "coming-soon",
    notes: "Awaiting standardized CSV export from 2024 PFAS dashboard.",
    lastUpdatedHint: "Updated as new surveys are published.",
  },
  {
    id: "iowa_sdwis_arsenic",
    title: "Arsenic Public Water Systems",
    provider: "EPA SDWIS / Iowa HHS",
    frequency: "Quarterly",
    domain: "Drinking Water",
    unit: "µg/L",
    endpoint: "/api/water/arsenic",
    description:
      "Regulated arsenic compliance data for community water systems, highlighting systems above 5 µg/L and violations over 10 µg/L.",
    metricKey: "arsenic",
    category: "monitor",
    status: "coming-soon",
    notes: "ETL will merge SDWIS downloads with Iowa HHS summaries.",
  },
  {
    id: "iowa_water_cache",
    title: "Iowa Water JSON Cache",
    provider: "Dashboard Pre-processing",
    frequency: "Daily",
    domain: "Infrastructure",
    unit: "records",
    endpoint: "public/data/water",
    description:
      "Cached JSON stubs generated via scripts/water-etl to unblock UI and API development while live integrations are prepared.",
    category: "index",
    status: "available",
    notes: "Stores nitrate, nitrite, E. coli, PFAS, arsenic, DBP, and fluoride series.",
  },
]
