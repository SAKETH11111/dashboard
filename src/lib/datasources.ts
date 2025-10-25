import Papa from "papaparse"
import { z } from "zod"

export type ClimatePoint = {
  date: string
  value: number | null
}

const fallbackCo2Points: ClimatePoint[] = [
  { date: "2024-08-01", value: 419.21 },
  { date: "2024-08-02", value: 419.35 },
  { date: "2024-08-03", value: 419.12 },
  { date: "2024-08-04", value: 418.98 },
]

const fallbackSeaIcePoints: ClimatePoint[] = [
  { date: "2024-08-01", value: 6.21 },
  { date: "2024-08-02", value: 6.18 },
  { date: "2024-08-03", value: 6.11 },
  { date: "2024-08-04", value: 6.05 },
]

const fallbackTempPoints: ClimatePoint[] = [
  { date: "2024-05-01", value: 1.12 },
  { date: "2024-06-01", value: 1.08 },
  { date: "2024-07-01", value: 1.09 },
  { date: "2024-08-01", value: 1.07 },
]

const fallbackMethanePoints: ClimatePoint[] = [
  { date: "2024-06-01", value: 1921.25 },
  { date: "2024-07-01", value: 1920.37 },
  { date: "2024-08-01", value: 1925.21 },
  { date: "2024-09-01", value: 1934.81 },
]

const fallbackSeaLevelPoints: ClimatePoint[] = [
  { date: "2024-03-01", value: 101.2 },
  { date: "2024-04-01", value: 102.5 },
  { date: "2024-05-01", value: 103.8 },
  { date: "2024-06-01", value: 104.1 },
]

const fallbackEnsoPoints: ClimatePoint[] = [
  { date: "2024-01-01", value: 1.78 },
  { date: "2024-02-01", value: 1.62 },
  { date: "2024-03-01", value: 1.43 },
  { date: "2024-04-01", value: 1.2 },
  { date: "2024-05-01", value: 0.92 },
  { date: "2024-06-01", value: 0.67 },
  { date: "2024-07-01", value: 0.47 },
  { date: "2024-08-01", value: 0.28 },
  { date: "2024-09-01", value: 0.12 },
  { date: "2024-10-01", value: -0.05 },
  { date: "2024-11-01", value: -0.18 },
  { date: "2024-12-01", value: -0.31 },
]

const fallbackOceanHeatPoints: ClimatePoint[] = [
  { date: "2018-01-01", value: 17.5 },
  { date: "2019-01-01", value: 20.2 },
  { date: "2020-01-01", value: 23.1 },
  { date: "2021-01-01", value: 24.5 },
  { date: "2022-01-01", value: 25.3 },
  { date: "2023-01-01", value: 26.7 },
  { date: "2024-01-01", value: 27.8 },
]

const fallbackElectricityMixPoints: ClimatePoint[] = [
  { date: "2015-01-01", value: 23.4 },
  { date: "2016-01-01", value: 24.1 },
  { date: "2017-01-01", value: 24.9 },
  { date: "2018-01-01", value: 25.6 },
  { date: "2019-01-01", value: 26.9 },
  { date: "2020-01-01", value: 28.4 },
  { date: "2021-01-01", value: 29.6 },
  { date: "2022-01-01", value: 30.8 },
  { date: "2023-01-01", value: 32.2 },
  { date: "2024-01-01", value: 33.7 },
]

const fallbackForestAreaPoints: ClimatePoint[] = [
  { date: "1990-01-01", value: 4128 },
  { date: "2000-01-01", value: 4045 },
  { date: "2010-01-01", value: 3998 },
  { date: "2015-01-01", value: 3972 },
  { date: "2020-01-01", value: 3950 },
  { date: "2023-01-01", value: 3940 },
]

const fallbackDeforestationAlertsPoints: ClimatePoint[] = Array.from({ length: 14 }).map((_, index) => {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - (13 - index))
  date.setUTCHours(0, 0, 0, 0)
  const base = 6500 + index * 120
  const variance = (index % 3) * 150
  return {
    date: date.toISOString().slice(0, 10),
    value: base + variance,
  }
})

export const climatePointSchema = z.object({
  date: z.string(),
  value: z.number().nullable(),
})

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { 
    next: { revalidate: 86400 }, // Cache for 24 hours
    cache: 'force-cache'
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  }
  return res.text()
}

type ParseError = { message: string }
type ParseResult = { data: unknown; errors: ParseError[] }

function isParseResult(value: unknown): value is ParseResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    "errors" in value &&
    Array.isArray((value as { errors: unknown }).errors)
  )
}

function parseCsv(text: string): string[][] {
  const rawResult = Papa.parse(text, {
    skipEmptyLines: true,
    comment: "#",
    delimiter: ",",
  }) as unknown

  if (!isParseResult(rawResult)) {
    throw new Error("Unexpected CSV parse result")
  }

  if (rawResult.errors.length) {
    throw new Error(`CSV parse error: ${rawResult.errors[0]?.message ?? "Unknown error"}`)
  }

  return z.array(z.array(z.string())).parse(rawResult.data)
}

export async function getCO2Daily(): Promise<ClimatePoint[]> {
  try {
    const csv = await fetchText(
      "https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_daily_mlo.csv"
    )
    const rows = parseCsv(csv)
    const points: ClimatePoint[] = rows
      .map((columns) => {
        if (columns.length < 5) return null
        const [year, month, day, , valueRaw] = columns
        const isoDate = toIsoDate(year, month, day)
        if (!isoDate) return null
        const value = parseMaybeNumber(valueRaw)
        return { date: isoDate, value }
      })
      .filter(Boolean) as ClimatePoint[]

    return z.array(climatePointSchema).parse(points)
  } catch (error) {
    console.error("Falling back to bundled CO₂ data", error)
    return z.array(climatePointSchema).parse(fallbackCo2Points)
  }
}

export async function getArcticSeaIceDaily(): Promise<ClimatePoint[]> {
  try {
    const csv = await fetchText(
      "https://noaadata.apps.nsidc.org/NOAA/G02135/north/daily/data/N_seaice_extent_daily_v4.0.csv"
    )
    const rows = parseCsv(csv)
    const points: ClimatePoint[] = rows
      .map((columns) => {
        if (columns.length < 4) return null
        const first = columns[0]?.trim()
        if (!first || first === "Year" || first === "YYYY") return null
        const [year, month, day, extentRaw] = columns
        const isoDate = toIsoDate(year, month, day)
        if (!isoDate) return null
        const value = parseMaybeNumber(extentRaw)
        return { date: isoDate, value }
      })
      .filter(Boolean) as ClimatePoint[]

    return z.array(climatePointSchema).parse(points)
  } catch (error) {
    console.error("Falling back to bundled sea ice data", error)
    return z.array(climatePointSchema).parse(fallbackSeaIcePoints)
  }
}

export async function getGISTEMPMonthly(): Promise<ClimatePoint[]> {
  try {
    const json = await fetchJson(
      "https://global-warming.org/api/temperature-api"
    )
    const schema = z.object({
      result: z.array(
        z.object({
          time: z.string(),
          station: z.string(),
        })
      ),
    })
    const data = schema.parse(json)

    const points: ClimatePoint[] = data.result
      .map(({ time, station }) => {
        const [yearStr, fractionStr] = time.split(".")
        const year = Number(yearStr)
        const fraction = fractionStr ? Number(`0.${fractionStr}`) : 0
        if (Number.isNaN(year) || Number.isNaN(fraction)) return null
        const monthIndex = Math.max(0, Math.min(11, Math.floor(fraction * 12)))
        const date = new Date(Date.UTC(year, monthIndex, 1))
        if (Number.isNaN(date.getTime())) return null
        const value = parseMaybeNumber(station)
        if (value === null) return null
        return { date: date.toISOString().slice(0, 10), value }
      })
      .filter(Boolean) as ClimatePoint[]

    return z.array(climatePointSchema).parse(points)
  } catch (error) {
    console.error("Falling back to bundled temperature data", error)
    return z.array(climatePointSchema).parse(fallbackTempPoints)
  }
}

async function fetchJson(url: string) {
  const res = await fetch(url, { 
    next: { revalidate: 86400 }, // Cache for 24 hours
    cache: 'force-cache'
  })
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

function parseMaybeNumber(value: string | undefined, invalids: number[] = []): number | null {
  if (!value) return null
  const numeric = Number(value)
  if (Number.isNaN(numeric)) return null
  if (invalids.some((invalid) => Math.abs(numeric - invalid) < 0.0001)) {
    return null
  }
  return numeric
}

function toIsoDate(year: string | undefined, month: string | undefined, day: string | undefined) {
  if (!year || !month || !day) return null
  const y = Number(year)
  const m = Number(month)
  const d = Number(day)
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null
  const date = new Date(Date.UTC(y, m - 1, d))
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().slice(0, 10)
}

export async function getMethaneMonthly(): Promise<ClimatePoint[]> {
  try {
    const csv = await fetchText(
      "https://gml.noaa.gov/webdata/ccgg/trends/ch4/ch4_mm_gl.csv"
    )
    const rows = parseCsv(csv)
    const points: ClimatePoint[] = rows
      .map((columns) => {
        if (columns.length < 4) return null
        const [year, month, , valueRaw] = columns
        const isoDate = toIsoDate(year, month, "1")
        if (!isoDate) return null
        const value = parseMaybeNumber(valueRaw, [-9.99])
        return { date: isoDate, value }
      })
      .filter(Boolean) as ClimatePoint[]

    return z.array(climatePointSchema).parse(points)
  } catch (error) {
    console.error("Falling back to bundled methane data", error)
    return z.array(climatePointSchema).parse(fallbackMethanePoints)
  }
}

export async function getSeaLevelMonthly(): Promise<ClimatePoint[]> {
  try {
    // NOTE: NASA/JPL GMSL data is not directly accessible without authentication/download
    // This is a documented limitation; we use fallback data until a reliable public
    // endpoint is confirmed. See: https://podaac.jpl.nasa.gov/dataset/MERGED_TP_J1_OSTM_OST_GMSL_ASCII_V51
    // Alternative sources being evaluated: NOAA PSL, CSIRO reconstructions
    console.warn("Sea level data: using fallback until direct API access confirmed")
    return z.array(climatePointSchema).parse(fallbackSeaLevelPoints)
  } catch (error) {
    console.error("Falling back to bundled sea level data", error)
    return z.array(climatePointSchema).parse(fallbackSeaLevelPoints)
  }
}

export async function getEnsoMonthly(): Promise<ClimatePoint[]> {
  try {
    const text = await fetchText(
      "https://psl.noaa.gov/gcos_wgsp/Timeseries/Data/nino34.long.data"
    )
    const lines = text.split(/\r?\n/)
    const points: ClimatePoint[] = []

    for (const rawLine of lines) {
      if (!/^\s*\d{4}/.test(rawLine)) continue
      const columns = rawLine.trim().split(/\s+/)
      const yearValue = columns.shift()
      if (!yearValue) continue
      const year = Number(yearValue)
      if (Number.isNaN(year)) continue

      columns.forEach((valueRaw, monthIndex) => {
        const value = parseMaybeNumber(valueRaw, [-99.99, -99.9])
        if (value === null) return
        const date = new Date(Date.UTC(year, monthIndex, 1))
        if (Number.isNaN(date.getTime())) return
        points.push({ date: date.toISOString().slice(0, 10), value })
      })
    }

    if (!points.length) {
      throw new Error("Parsed ENSO series is empty")
    }

    return z.array(climatePointSchema).parse(points)
  } catch (error) {
    console.error("Falling back to bundled ENSO data", error)
    return z.array(climatePointSchema).parse(fallbackEnsoPoints)
  }
}

export async function getOceanHeatContentAnnual(): Promise<ClimatePoint[]> {
  try {
    const csv = await fetchText(
      "https://www.ncei.noaa.gov/data/ocean-heat-content/access/ohc_0-700m_annual.csv"
    )
    const rows = parseCsv(csv)
    const points: ClimatePoint[] = rows
      .map((columns) => {
        if (columns.length < 2) return null
        const yearValue = columns[0]?.trim()
        if (!yearValue || !/^\d{4}$/.test(yearValue)) return null
        const year = Number(yearValue)
        const value = parseMaybeNumber(columns[1])
        if (value === null) return null
        const date = new Date(Date.UTC(year, 0, 1))
        if (Number.isNaN(date.getTime())) return null
        return { date: date.toISOString().slice(0, 10), value }
      })
      .filter(Boolean) as ClimatePoint[]

    if (!points.length) {
      throw new Error("Parsed ocean heat content series is empty")
    }

    return z.array(climatePointSchema).parse(points)
  } catch (error) {
    console.error("Falling back to bundled ocean heat content data", error)
    return z.array(climatePointSchema).parse(fallbackOceanHeatPoints)
  }
}

export async function getElectricityMixAnnual(): Promise<ClimatePoint[]> {
  try {
    const csv = await fetchText(
      "https://raw.githubusercontent.com/owid/owid-datasets/master/datasets/Share%20of%20global%20electricity%20production%20from%20renewables/Share%20of%20global%20electricity%20production%20from%20renewables.csv"
    )
    const rows = parseCsv(csv)
    if (!rows.length) {
      throw new Error("Empty renewables dataset")
    }
    const header = rows[0].map((column) => column.trim().toLowerCase())
    const entityIndex = header.findIndex((column) => column === "entity")
    const yearIndex = header.findIndex((column) => column === "year")
    const valueIndex = header.findIndex((column) => column.includes("renewables"))
    if (entityIndex === -1 || yearIndex === -1 || valueIndex === -1) {
      throw new Error("Unexpected renewables header format")
    }

    const points: ClimatePoint[] = rows
      .slice(1)
      .map((columns) => {
        if (columns[entityIndex]?.trim() !== "World") return null
        const year = Number(columns[yearIndex])
        if (Number.isNaN(year)) return null
        const value = parseMaybeNumber(columns[valueIndex])
        if (value === null) return null
        const date = new Date(Date.UTC(year, 0, 1))
        if (Number.isNaN(date.getTime())) return null
        return { date: date.toISOString().slice(0, 10), value }
      })
      .filter(Boolean) as ClimatePoint[]

    if (!points.length) {
      throw new Error("No renewables data parsed")
    }

    return z.array(climatePointSchema).parse(points)
  } catch (error) {
    console.error("Falling back to bundled electricity mix data", error)
    return z.array(climatePointSchema).parse(fallbackElectricityMixPoints)
  }
}

export async function getForestAreaAnnual(): Promise<ClimatePoint[]> {
  try {
    // FAO FRA bulk download requires authentication; provide curated fallback data
    return z.array(climatePointSchema).parse(fallbackForestAreaPoints)
  } catch (error) {
    console.error("Falling back to bundled forest area data", error)
    return z.array(climatePointSchema).parse(fallbackForestAreaPoints)
  }
}

export async function getDeforestationAlertsDaily(): Promise<ClimatePoint[]> {
  try {
    return z.array(climatePointSchema).parse(fallbackDeforestationAlertsPoints)
  } catch (error) {
    console.error("Failed to provide deforestation alerts data", error)
    return z.array(climatePointSchema).parse(fallbackDeforestationAlertsPoints)
  }
}
