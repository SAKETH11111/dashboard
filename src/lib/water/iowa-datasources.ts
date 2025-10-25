import { readFile } from "fs/promises"
import path from "path"
import { cache } from "react"

import { z } from "zod"

import { applyWaterStatus, determinePointStatus } from "@/lib/water/alerts"
import { WATER_THRESHOLDS } from "@/lib/water/thresholds"
import { waterLogger } from "@/lib/water/logger"
import {
  advisoryTypeSchema,
  type AdvisoryType,
  type Contaminant,
  type WaterSeriesResponse,
  type WaterStatus,
  waterAdvisorySchema,
  waterSeriesCollectionSchema,
  waterSeriesResponseSchema,
} from "@/types/water"

const WATER_DATA_DIR = path.join(process.cwd(), "public", "data", "water")
const REMOTE_TIMEOUT_MS = 20_000

export type WaterSeriesQuery = {
  systemId?: string
  zip?: string
  county?: string
  type?: string
  kind?: string
  site?: string
}

type SeriesBuilder = (query?: WaterSeriesQuery) => Promise<WaterSeriesResponse | null>

const FILE_MAP: Record<Contaminant, string> = {
  nitrate: "nitrate.json",
  nitrite: "nitrite.json",
  ecoli: "bacteria.json",
  pfas: "pfas.json",
  arsenic: "arsenic.json",
  dbp: "dbp.json",
  fluoride: "fluoride.json",
}

// --- Shared helpers --------------------------------------------------------

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REMOTE_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        accept: "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`)
    }

    return (await response.json()) as T
  } finally {
    clearTimeout(timeout)
  }
}

function coerceNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === "number" && Number.isFinite(value)) return value
  const next = Number.parseFloat(String(value))
  return Number.isFinite(next) ? next : null
}

function formatAdvisoryId(parts: string[]) {
  return parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const readCachedSeries = cache(async (contaminant: Contaminant): Promise<WaterSeriesResponse> => {
  const filename = FILE_MAP[contaminant]
  if (!filename) {
    throw new Error(`Unsupported contaminant "${contaminant}"`)
  }
  const fullPath = path.join(WATER_DATA_DIR, filename)
  const raw = await readFile(fullPath, "utf8")
  const parsed = waterSeriesResponseSchema.parse(JSON.parse(raw))
  return applyWaterStatus(parsed)
})

function seriesMatchesQuery(series: WaterSeriesResponse, query?: WaterSeriesQuery) {
  if (!query) return true
  if (query.systemId && series.systemId && query.systemId !== series.systemId) return false
  if (query.zip && "zip" in series && (series as { zip?: string }).zip !== query.zip) return false
  if (query.county && "county" in series && (series as { county?: string }).county !== query.county) return false
  if (query.site && series.region && !series.region.toLowerCase().includes(query.site.toLowerCase())) {
    return false
  }
  return true
}

function normalizeSeries(series: WaterSeriesResponse): WaterSeriesResponse {
  const hydratedThreshold = series.threshold ?? WATER_THRESHOLDS[series.contaminant]
  return applyWaterStatus({
    ...series,
    threshold: hydratedThreshold,
  })
}

// --- Iowa DNR Beach Monitoring ---------------------------------------------

const DNR_BEACH_ENDPOINT = "https://programs.iowadnr.gov/beach/api/beachadvisories"
const DEFAULT_BEACH_SITE = "Big Creek Beach"

const dnrBeachRecordSchema = z.object({
  beachname: z.string().optional(),
  beach: z.string().optional(),
  beach_description: z.string().optional(),
  site_name: z.string().optional(),
  sitename: z.string().optional(),
  sampledate: z.string().optional(),
  sample_date: z.string().optional(),
  sample_dt: z.string().optional(),
  ecoli: z.union([z.string(), z.number()]).optional(),
  e_coli: z.union([z.string(), z.number()]).optional(),
  ecoli_mpn: z.union([z.string(), z.number()]).optional(),
  advisory: z.union([z.boolean(), z.string()]).optional(),
  notes: z.string().optional(),
})

type DnrBeachRecord = z.infer<typeof dnrBeachRecordSchema>

const STUB_DNR_BEACH: Array<{
  site: string
  sampleDate: string
  value: number | null
  advisory: boolean
}> = [
  { site: "Big Creek Beach", sampleDate: "2024-04-20", value: 22, advisory: false },
  { site: "Big Creek Beach", sampleDate: "2024-04-27", value: 35, advisory: false },
  { site: "Big Creek Beach", sampleDate: "2024-05-04", value: 58, advisory: false },
  { site: "Big Creek Beach", sampleDate: "2024-05-11", value: 165, advisory: true },
  { site: "Big Creek Beach", sampleDate: "2024-05-18", value: 280, advisory: true },
]

function normalizeBeachRecords(records: DnrBeachRecord[], query?: WaterSeriesQuery): WaterSeriesResponse | null {
  if (!records.length) return null

  const targetSite = query?.site ?? query?.systemId ?? DEFAULT_BEACH_SITE

  const normalized = records
    .map((record) => {
      const site =
        record.site_name ??
        record.sitename ??
        record.beachname ??
        record.beach ??
        record.beach_description ??
        DEFAULT_BEACH_SITE
      const sampleDate =
        record.sample_date ??
        record.sampledate ??
        record.sample_dt ??
        record.sampledate ??
        null
      if (!sampleDate) return null

      const value =
        coerceNumber(record.ecoli) ?? coerceNumber(record.e_coli) ?? coerceNumber(record.ecoli_mpn)
      const advisory =
        typeof record.advisory === "string"
          ? record.advisory.toLowerCase().startsWith("y")
          : Boolean(record.advisory)

      return { site, sampleDate: sampleDate.slice(0, 10), value, advisory }
    })
    .filter(Boolean) as typeof STUB_DNR_BEACH

  const siteRecords = normalized.filter((record) =>
    record.site.toLowerCase().includes(targetSite.toLowerCase()),
  )

  const dataset = siteRecords.length ? siteRecords : normalized
  const region = dataset[0]?.site ?? DEFAULT_BEACH_SITE

  const points = dataset
    .map((record) => ({
      date: record.sampleDate,
      value: record.value,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const advisories = dataset
    .filter((record) => record.advisory)
    .map((record) =>
      waterAdvisorySchema.parse({
        id: formatAdvisoryId(["dnr", region, record.sampleDate]),
        type: "swim",
        contaminant: "ecoli",
        title: "Swim advisory issued",
        summary: `E. coli levels exceeded recreational thresholds on ${record.sampleDate}. Avoid swallowing water and follow DNR guidance.`,
        issuedAt: new Date(record.sampleDate).toISOString(),
        source: "Iowa DNR Beach Monitoring",
        sourceUrl: DNR_BEACH_ENDPOINT,
        status: "alert",
      }),
    )

  return normalizeSeries({
    contaminant: "ecoli",
    metric: "E. coli",
    unit: "MPN/100mL",
    source: "Iowa DNR Beach Monitoring",
    sourceUrl: "https://www.iowadnr.gov/Things-to-Do/Beach-Monitoring",
    updatedAt: points.at(-1)?.date
      ? new Date(points.at(-1)!.date).toISOString()
      : new Date().toISOString(),
    region,
    regionType: "site",
    points,
    advisories,
    status: "unknown",
  })
}

async function fetchDnrBeachSeries(query?: WaterSeriesQuery) {
  try {
    const payload = await fetchJson<unknown[]>(DNR_BEACH_ENDPOINT)
    const parsed = z.array(dnrBeachRecordSchema).parse(payload)
    const series = normalizeBeachRecords(parsed, query)
    if (series) {
      waterLogger.info("dnr-beach", "Loaded live DNR beach monitoring data", {
        rows: parsed.length,
      })
      return series
    }
  } catch (error) {
    waterLogger.warn("dnr-beach", "Falling back to stub beach monitoring data", error)
  }

  return normalizeBeachRecords(STUB_DNR_BEACH as unknown as DnrBeachRecord[], query)
}

// --- PFAS dashboard --------------------------------------------------------

const DNR_PFAS_ENDPOINT =
  "https://data.iowa.gov/resource/vwpp-6i3e.json?$select=system_id,system_name,sample_date,sum_pfoa_pfOS&$order=sample_date"

const pfasRecordSchema = z.object({
  system_id: z.string().optional(),
  system_name: z.string().optional(),
  sample_date: z.string(),
  sum_pfoa_pfos: z.union([z.string(), z.number()]).optional(),
  result: z.union([z.string(), z.number()]).optional(),
})

type PfasRecord = z.infer<typeof pfasRecordSchema>

const STUB_PFAS_RECORDS: PfasRecord[] = [
  { system_id: "IA5224026", system_name: "Quad Cities Davenport", sample_date: "2023-06-15", sum_pfoa_pfos: 3.1 },
  { system_id: "IA5224026", system_name: "Quad Cities Davenport", sample_date: "2023-09-18", sum_pfoa_pfos: 3.6 },
  { system_id: "IA5224026", system_name: "Quad Cities Davenport", sample_date: "2023-12-12", sum_pfoa_pfos: 3.9 },
  { system_id: "IA5224026", system_name: "Quad Cities Davenport", sample_date: "2024-03-25", sum_pfoa_pfos: 4.3 },
]

function normalizePfasRecords(records: PfasRecord[], query?: WaterSeriesQuery) {
  if (!records.length) return null
  const systemId = query?.systemId ?? records[0]?.system_id ?? "IA5224026"
  const filtered = records.filter((record) =>
    systemId ? record.system_id === systemId : true,
  )

  const dataset = filtered.length ? filtered : records
  const region = dataset[0]?.system_name ?? "Iowa Public Water System"

  const points = dataset
    .map((record) => ({
      date: record.sample_date.slice(0, 10),
      value: coerceNumber(record.sum_pfoa_pfos ?? record.result),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const latest = points.at(-1)
  const advisories =
    latest && latest.value != null && latest.value >= (WATER_THRESHOLDS.pfas.alertLevel ?? 4)
      ? [
          waterAdvisorySchema.parse({
            id: formatAdvisoryId(["pfas", systemId, latest.date]),
            type: "pfas",
            contaminant: "pfas",
            title: "PFAS exceedance notice",
            summary: `Most recent PFAS sample measured ${latest.value} ppt, above the 4 ppt MCL.`,
            issuedAt: new Date(latest.date).toISOString(),
            affectedSystems: [systemId],
            source: "Iowa DNR PFAS Survey",
            sourceUrl: "https://www.iowadnr.gov/Environmental-Protection/Water-Quality/PFAS",
            status: determinePointStatus(latest.value, WATER_THRESHOLDS.pfas),
          }),
        ]
      : []

  return normalizeSeries({
    contaminant: "pfas",
    metric: "PFAS (PFOA + PFOS)",
    unit: "ppt",
    source: "Iowa DNR PFAS Survey",
    sourceUrl: "https://www.iowadnr.gov/Environmental-Protection/Water-Quality/PFAS",
    updatedAt: latest ? new Date(latest.date).toISOString() : new Date().toISOString(),
    region,
    regionType: "system",
    systemId: dataset[0]?.system_id ?? systemId,
    points,
    advisories,
    status: "unknown",
  })
}

async function fetchPfasDashboardSeries(query?: WaterSeriesQuery) {
  try {
    const payload = await fetchJson<unknown[]>(DNR_PFAS_ENDPOINT)
    const parsed = z.array(pfasRecordSchema).parse(payload)
    const series = normalizePfasRecords(parsed, query)
    if (series) {
      waterLogger.info("pfas-dashboard", "Loaded PFAS dashboard data", { rows: parsed.length })
      return series
    }
  } catch (error) {
    waterLogger.warn("pfas-dashboard", "Falling back to stub PFAS data", error)
  }

  return normalizePfasRecords(STUB_PFAS_RECORDS, query)
}

// --- SDWIS / Iowa HHS compliance summaries ---------------------------------

type SdwisRecord = {
  systemId: string
  systemName: string
  county?: string
  sampleDate: string
  value: number | null
  unit: string
  source: string
  metric: string
  contaminant: Contaminant
}

const SDWIS_STUBS: Record<Contaminant, SdwisRecord[]> = {
  nitrate: [
    {
      systemId: "IA2580091",
      systemName: "Des Moines Water Works",
      sampleDate: "2023-12-01",
      value: 4.2,
      unit: "mg/L",
      source: "Iowa DNR Source Water (stub)",
      metric: "Nitrate (as N)",
      contaminant: "nitrate",
    },
    {
      systemId: "IA2580091",
      systemName: "Des Moines Water Works",
      sampleDate: "2024-01-01",
      value: 4.8,
      unit: "mg/L",
      source: "Iowa DNR Source Water (stub)",
      metric: "Nitrate (as N)",
      contaminant: "nitrate",
    },
    {
      systemId: "IA2580091",
      systemName: "Des Moines Water Works",
      sampleDate: "2024-02-01",
      value: 5.5,
      unit: "mg/L",
      source: "Iowa DNR Source Water (stub)",
      metric: "Nitrate (as N)",
      contaminant: "nitrate",
    },
    {
      systemId: "IA2580091",
      systemName: "Des Moines Water Works",
      sampleDate: "2024-03-01",
      value: 6.2,
      unit: "mg/L",
      source: "Iowa DNR Source Water (stub)",
      metric: "Nitrate (as N)",
      contaminant: "nitrate",
    },
    {
      systemId: "IA2580091",
      systemName: "Des Moines Water Works",
      sampleDate: "2024-04-01",
      value: 6.7,
      unit: "mg/L",
      source: "Iowa DNR Source Water (stub)",
      metric: "Nitrate (as N)",
      contaminant: "nitrate",
    },
    {
      systemId: "IA2580091",
      systemName: "Des Moines Water Works",
      sampleDate: "2024-05-01",
      value: 7.1,
      unit: "mg/L",
      source: "Iowa DNR Source Water (stub)",
      metric: "Nitrate (as N)",
      contaminant: "nitrate",
    },
  ],
  nitrite: [
    {
      systemId: "IA3114560",
      systemName: "Cedar Rapids Water",
      sampleDate: "2023-10-01",
      value: 0.12,
      unit: "mg/L",
      source: "Iowa DNR Compliance (stub)",
      metric: "Nitrite (as N)",
      contaminant: "nitrite",
    },
    {
      systemId: "IA3114560",
      systemName: "Cedar Rapids Water",
      sampleDate: "2023-12-01",
      value: 0.16,
      unit: "mg/L",
      source: "Iowa DNR Compliance (stub)",
      metric: "Nitrite (as N)",
      contaminant: "nitrite",
    },
    {
      systemId: "IA3114560",
      systemName: "Cedar Rapids Water",
      sampleDate: "2024-02-01",
      value: 0.24,
      unit: "mg/L",
      source: "Iowa DNR Compliance (stub)",
      metric: "Nitrite (as N)",
      contaminant: "nitrite",
    },
    {
      systemId: "IA3114560",
      systemName: "Cedar Rapids Water",
      sampleDate: "2024-04-01",
      value: 0.32,
      unit: "mg/L",
      source: "Iowa DNR Compliance (stub)",
      metric: "Nitrite (as N)",
      contaminant: "nitrite",
    },
  ],
  arsenic: [
    {
      systemId: "IA5970011",
      systemName: "City of Marshalltown",
      sampleDate: "2023-05-01",
      value: 4.8,
      unit: "µg/L",
      source: "EPA SDWIS (stub)",
      metric: "Arsenic",
      contaminant: "arsenic",
    },
    {
      systemId: "IA5970011",
      systemName: "City of Marshalltown",
      sampleDate: "2023-08-01",
      value: 5.2,
      unit: "µg/L",
      source: "EPA SDWIS (stub)",
      metric: "Arsenic",
      contaminant: "arsenic",
    },
    {
      systemId: "IA5970011",
      systemName: "City of Marshalltown",
      sampleDate: "2023-11-01",
      value: 6.1,
      unit: "µg/L",
      source: "EPA SDWIS (stub)",
      metric: "Arsenic",
      contaminant: "arsenic",
    },
    {
      systemId: "IA5970011",
      systemName: "City of Marshalltown",
      sampleDate: "2024-02-01",
      value: 6.4,
      unit: "µg/L",
      source: "EPA SDWIS (stub)",
      metric: "Arsenic",
      contaminant: "arsenic",
    },
  ],
  dbp: [
    {
      systemId: "IA2570970",
      systemName: "West Des Moines Water Works",
      sampleDate: "2023-03-31",
      value: 58.2,
      unit: "µg/L",
      source: "Iowa HHS Compliance (stub)",
      metric: "Disinfection Byproducts (TTHM)",
      contaminant: "dbp",
    },
    {
      systemId: "IA2570970",
      systemName: "West Des Moines Water Works",
      sampleDate: "2023-06-30",
      value: 61.7,
      unit: "µg/L",
      source: "Iowa HHS Compliance (stub)",
      metric: "Disinfection Byproducts (TTHM)",
      contaminant: "dbp",
    },
    {
      systemId: "IA2570970",
      systemName: "West Des Moines Water Works",
      sampleDate: "2023-09-30",
      value: 63.5,
      unit: "µg/L",
      source: "Iowa HHS Compliance (stub)",
      metric: "Disinfection Byproducts (TTHM)",
      contaminant: "dbp",
    },
    {
      systemId: "IA2570970",
      systemName: "West Des Moines Water Works",
      sampleDate: "2023-12-31",
      value: 64.8,
      unit: "µg/L",
      source: "Iowa HHS Compliance (stub)",
      metric: "Disinfection Byproducts (TTHM)",
      contaminant: "dbp",
    },
  ],
  fluoride: [
    {
      systemId: "IA8300487",
      systemName: "Sioux City Water",
      sampleDate: "2023-09-30",
      value: 0.76,
      unit: "mg/L",
      source: "Iowa HHS Oral Health (stub)",
      metric: "Fluoride",
      contaminant: "fluoride",
    },
    {
      systemId: "IA8300487",
      systemName: "Sioux City Water",
      sampleDate: "2023-10-31",
      value: 0.74,
      unit: "mg/L",
      source: "Iowa HHS Oral Health (stub)",
      metric: "Fluoride",
      contaminant: "fluoride",
    },
    {
      systemId: "IA8300487",
      systemName: "Sioux City Water",
      sampleDate: "2023-11-30",
      value: 0.71,
      unit: "mg/L",
      source: "Iowa HHS Oral Health (stub)",
      metric: "Fluoride",
      contaminant: "fluoride",
    },
    {
      systemId: "IA8300487",
      systemName: "Sioux City Water",
      sampleDate: "2023-12-31",
      value: 0.69,
      unit: "mg/L",
      source: "Iowa HHS Oral Health (stub)",
      metric: "Fluoride",
      contaminant: "fluoride",
    },
    {
      systemId: "IA8300487",
      systemName: "Sioux City Water",
      sampleDate: "2024-01-31",
      value: 0.72,
      unit: "mg/L",
      source: "Iowa HHS Oral Health (stub)",
      metric: "Fluoride",
      contaminant: "fluoride",
    },
  ],
  pfas: STUB_PFAS_RECORDS.map((record) => ({
    systemId: record.system_id ?? "IA5224026",
    systemName: record.system_name ?? "Quad Cities Davenport",
    sampleDate: record.sample_date,
    value: coerceNumber(record.sum_pfoa_pfos) ?? null,
    unit: "ppt",
    source: "Iowa DNR PFAS Survey (stub)",
    metric: "PFAS (PFOA + PFOS)",
    contaminant: "pfas" as const,
  })),
  ecoli: STUB_DNR_BEACH.map((record) => ({
    systemId: "IA-BEACH",
    systemName: record.site,
    sampleDate: record.sampleDate,
    value: record.value,
    unit: "MPN/100mL",
    source: "Iowa DNR Beach Monitoring (stub)",
    metric: "E. coli",
    contaminant: "ecoli" as const,
  })),
}

async function fetchSdwisSeries(contaminant: Contaminant, query?: WaterSeriesQuery) {
  // TODO: upgrade to live SDWIS / HHS integrations. For now fall back to structured stub data.
  waterLogger.warn("sdwis", `Live SDWIS integration for ${contaminant} not configured; using stub data.`)

  const dataset = SDWIS_STUBS[contaminant] ?? []
  if (!dataset.length) return null

  const targetSystemId = query?.systemId ?? dataset[0]?.systemId

  const filtered = dataset.filter((record) =>
    targetSystemId ? record.systemId === targetSystemId : true,
  )

  const points = filtered
    .map((record) => ({
      date: record.sampleDate,
      value: record.value,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  const threshold = WATER_THRESHOLDS[contaminant]
  const latest = points.at(-1)

  return normalizeSeries({
    contaminant,
    metric: filtered[0]?.metric ?? threshold.label ?? contaminant.toUpperCase(),
    unit: filtered[0]?.unit ?? threshold.unit,
    source: filtered[0]?.source ?? "EPA SDWIS (stub)",
    sourceUrl: "https://data.epa.gov/efservice",
    updatedAt: latest ? new Date(latest.date).toISOString() : new Date().toISOString(),
    region: filtered[0]?.systemName ?? "Iowa Public Water System",
    regionType: "system",
    systemId: targetSystemId,
    points,
    advisories: [],
    status: "unknown",
  })
}

// --- IWQIS / USGS nitrate sensors ------------------------------------------

export type RealtimeNitrateSensor = {
  siteId: string
  name: string
  lastSample: string
  value: number | null
  unit: string
  status: WaterStatus
  source: string
  sourceUrl: string
}

const IWQIS_SENSOR_ENDPOINT =
  "https://iwqis.iowawis.org/iwqisws/api/stations?sensor=Nitrate&interval=hourly"

const SENSOR_STUBS: Array<Omit<RealtimeNitrateSensor, "status"> & { status?: WaterStatus }> = [
  {
    siteId: "USGS-05485500",
    name: "Raccoon River at Des Moines",
    lastSample: "2024-05-21T11:00:00Z",
    value: 8.6,
    unit: "mg/L",
    source: "USGS NWIS (stub)",
    sourceUrl: "https://waterdata.usgs.gov/ia/nwis/uv/?site_no=05485500",
  },
  {
    siteId: "USGS-05451700",
    name: "Cedar River at Cedar Rapids",
    lastSample: "2024-05-21T10:30:00Z",
    value: 6.1,
    unit: "mg/L",
    source: "USGS NWIS (stub)",
    sourceUrl: "https://waterdata.usgs.gov/ia/nwis/uv/?site_no=05451700",
  },
  {
    siteId: "IWQIS-1234",
    name: "Des Moines River near Saylorville",
    lastSample: "2024-05-21T10:45:00Z",
    value: 5.2,
    unit: "mg/L",
    source: "IWQIS (stub)",
    sourceUrl: "https://iwqis.iowawis.org/",
  },
]

const nitrateThreshold = WATER_THRESHOLDS.nitrate

export async function fetchRealtimeNitrateSensors(): Promise<RealtimeNitrateSensor[]> {
  try {
    const payload = await fetchJson<unknown[]>(IWQIS_SENSOR_ENDPOINT)
    if (Array.isArray(payload) && payload.length) {
      waterLogger.info("iwqis", "Live IWQIS nitrate sensors not yet parsed; using stub set.")
    }
  } catch (error) {
    waterLogger.warn("iwqis", "Unable to reach IWQIS/USGS service; using stub sensors.", error)
  }

  return SENSOR_STUBS.map((sensor) => ({
    ...sensor,
    status: determinePointStatus(sensor.value, nitrateThreshold),
  }))
}

// --- Remote builder registry -----------------------------------------------

const REMOTE_BUILDERS: Partial<Record<Contaminant, SeriesBuilder>> = {
  ecoli: fetchDnrBeachSeries,
  pfas: fetchPfasDashboardSeries,
  nitrate: (query) => fetchSdwisSeries("nitrate", query),
  nitrite: (query) => fetchSdwisSeries("nitrite", query),
  arsenic: (query) => fetchSdwisSeries("arsenic", query),
  dbp: (query) => fetchSdwisSeries("dbp", query),
  fluoride: (query) => fetchSdwisSeries("fluoride", query),
}

// --- Public API ------------------------------------------------------------

export async function getWaterSeries(
  contaminant: Contaminant,
  query?: WaterSeriesQuery,
): Promise<WaterSeriesResponse | null> {
  const builder = REMOTE_BUILDERS[contaminant]
  if (builder) {
    try {
      const remote = await builder(query)
      if (remote && seriesMatchesQuery(remote, query)) {
        return normalizeSeries(remote)
      }
    } catch (error) {
      waterLogger.warn(`series-${contaminant}`, "Remote builder failed; falling back to cached JSON.", error)
    }
  }

  const cached = await readCachedSeries(contaminant)
  return seriesMatchesQuery(cached, query) ? cached : null
}

export async function getWaterSeriesStrict(
  contaminant: Contaminant,
  query?: WaterSeriesQuery,
): Promise<WaterSeriesResponse> {
  const series = await getWaterSeries(contaminant, query)
  if (!series) {
    throw new Error(`No water series found for ${contaminant}`)
  }
  return series
}

export async function getWaterSeriesCollection(contaminants?: Contaminant[]) {
  const targets = contaminants ?? (Object.keys(FILE_MAP) as Contaminant[])
  const data = await Promise.all(
    targets.map(async (contaminant) => {
      try {
        return await getWaterSeriesStrict(contaminant)
      } catch (error) {
        waterLogger.error(`series-${contaminant}`, "Failed to load water series", error)
        return null
      }
    }),
  )
  const filtered = data.filter(Boolean) as WaterSeriesResponse[]
  return waterSeriesCollectionSchema.parse({
    data: filtered,
    generatedAt: new Date().toISOString(),
  })
}

export function getLatestWaterPoint(series: WaterSeriesResponse) {
  const latest = [...series.points]
    .reverse()
    .find((point) => point.value !== null && point.value !== undefined)
  return latest ?? null
}

export async function getWaterAdvisories(filter?: { type?: AdvisoryType }) {
  const { data: series } = await getWaterSeriesCollection()
  const advisories = series.flatMap((item) => item.advisories ?? [])
  const unique = new Map(
    advisories.map((advisory) => [advisory.id, waterAdvisorySchema.parse(advisory)] as const),
  )

  let results = Array.from(unique.values())

  if (filter?.type) {
    const type = advisoryTypeSchema.parse(filter.type)
    results = results.filter((advisory) => advisory.type === type)
  }

  return results.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt))
}

export async function getWaterDatasourcesOverview() {
  const collection = await getWaterSeriesCollection()
  return {
    contaminants: collection.data.map((series) => ({
      contaminant: series.contaminant,
      region: series.region,
      source: series.source,
      updatedAt: series.updatedAt,
      status: series.status,
    })),
    generatedAt: collection.generatedAt,
  }
}

const waterSeriesResponseListSchema = z.array(waterSeriesResponseSchema)

export async function loadWaterSeriesFromJson(json: unknown) {
  return waterSeriesResponseListSchema.parse(json)
}

export function validateWaterSeries(series: WaterSeriesResponse) {
  return waterSeriesResponseSchema.parse(series)
}

export const getIowaNitrateSeries = (query?: WaterSeriesQuery) => getWaterSeriesStrict("nitrate", query)
export const getIowaNitriteSeries = (query?: WaterSeriesQuery) => getWaterSeriesStrict("nitrite", query)
export const getIowaBacteriaSeries = (query?: WaterSeriesQuery) => getWaterSeriesStrict("ecoli", query)
export const getIowaPfasSeries = (query?: WaterSeriesQuery) => getWaterSeriesStrict("pfas", query)
export const getIowaArsenicSeries = (query?: WaterSeriesQuery) => getWaterSeriesStrict("arsenic", query)
export const getIowaDbpSeries = (query?: WaterSeriesQuery) => getWaterSeriesStrict("dbp", query)
export const getIowaFluorideSeries = (query?: WaterSeriesQuery) => getWaterSeriesStrict("fluoride", query)

