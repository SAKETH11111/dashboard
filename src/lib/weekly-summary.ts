import { getArcticSeaIceDaily, getCO2Daily, getGISTEMPMonthly, getSeaLevelMonthly, getMethaneMonthly, type ClimatePoint } from "@/lib/datasources"
import type { NewsItem } from "@/types/content"

export type TrendDirection = "up" | "down" | "flat"

export type MetricKey = "co2" | "sea-ice" | "temp" | "sea-level" | "methane"

export type MetricSummary = {
  key: MetricKey
  label: string
  unit: string
  latestDate: string
  latestValue: number | null
  comparisonDate: string | null
  comparisonValue: number | null
  delta: number | null
  deltaPercent: number | null
  periodLabel: string
  trend: TrendDirection
  source: string
}

export type NewsStory = {
  title: string
  link: string
  source: string
  publishedAt: string
}

export type WeeklySummary = {
  generatedAt: string
  metrics: MetricSummary[]
  headline: string
  summaryText: string
  topStories: NewsStory[]
}

export async function buildWeeklySummary(): Promise<WeeklySummary> {
  const [co2Points, seaIcePoints, tempPoints, seaLevelPoints, methanePoints, newsData] = await Promise.all([
    getCO2Daily(),
    getArcticSeaIceDaily(),
    getGISTEMPMonthly(),
    getSeaLevelMonthly(),
    getMethaneMonthly(),
    fetchTopNews(),
  ])

  const metrics: MetricSummary[] = [
    buildMetricSummary({
      key: "co2",
      label: "Atmospheric CO₂",
      unit: "ppm",
      points: co2Points,
      minDaySeparation: 6,
      periodLabel: "vs 7 days ago",
      source: "NOAA Mauna Loa Observatory",
    }),
    buildMetricSummary({
      key: "sea-ice",
      label: "Arctic Sea Ice",
      unit: "million km²",
      points: seaIcePoints,
      minDaySeparation: 6,
      periodLabel: "vs 7 days ago",
      source: "NSIDC Sea Ice Index",
    }),
    buildMetricSummary({
      key: "temp",
      label: "Global Temperature Anomaly",
      unit: "°C",
      points: tempPoints,
      minDaySeparation: 28,
      periodLabel: "vs last month",
      source: "NASA GISTEMP v4",
    }),
    buildMetricSummary({
      key: "sea-level",
      label: "Global Mean Sea Level",
      unit: "mm",
      points: seaLevelPoints,
      minDaySeparation: 28,
      periodLabel: "vs last month",
      source: "NASA/JPL",
    }),
    buildMetricSummary({
      key: "methane",
      label: "Atmospheric Methane",
      unit: "ppb",
      points: methanePoints,
      minDaySeparation: 28,
      periodLabel: "vs last month",
      source: "NOAA GML",
    }),
  ]

  const generatedAt = new Date().toISOString()
  const headline = composeHeadline(metrics)
  const summaryText = composeSummaryText(metrics, generatedAt)

  return {
    generatedAt,
    metrics,
    headline,
    summaryText,
    topStories: newsData,
  }
}

async function fetchTopNews(): Promise<NewsStory[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const response = await fetch(`${baseUrl}/api/news`, {
      next: { revalidate: 1800 },
    })
    
    if (!response.ok) {
      console.warn("Failed to fetch news for weekly summary")
      return []
    }

    const data = await response.json()
    const items = data.items || []
    
    // Get top 3 most recent stories
    return items.slice(0, 3).map((item: NewsItem) => ({
      title: item.title,
      link: item.link,
      source: item.source,
      publishedAt: item.publishedAt,
    }))
  } catch (error) {
    console.error("Error fetching news for weekly summary:", error)
    return []
  }
}

type SummaryOptions = {
  key: MetricKey
  label: string
  unit: string
  points: ClimatePoint[]
  minDaySeparation: number
  periodLabel: string
  source: string
}

function buildMetricSummary(options: SummaryOptions): MetricSummary {
  const sorted = [...options.points].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const latest = findLatest(sorted)

  if (!latest) {
    return {
      key: options.key,
      label: options.label,
      unit: options.unit,
      latestDate: "",
      latestValue: null,
      comparisonDate: null,
      comparisonValue: null,
      delta: null,
      deltaPercent: null,
      periodLabel: options.periodLabel,
      trend: "flat",
      source: options.source,
    }
  }

  const comparison = findComparison(sorted, latest.index, options.minDaySeparation)
  const comparisonValue = comparison?.value ?? null
  const delta =
    comparisonValue !== null && latest.value !== null ? latest.value - comparisonValue : null
  const deltaPercent =
    delta !== null && comparisonValue !== null && comparisonValue !== 0
      ? (delta / comparisonValue) * 100
      : null
  const trend = determineTrend(delta)

  return {
    key: options.key,
    label: options.label,
    unit: options.unit,
    latestDate: latest.date,
    latestValue: latest.value,
    comparisonDate: comparison?.date ?? null,
    comparisonValue: comparison?.value ?? null,
    delta,
    deltaPercent,
    periodLabel: options.periodLabel,
    trend,
    source: options.source,
  }
}

function findLatest(points: ClimatePoint[]): { index: number; date: string; value: number | null } | null {
  for (let i = points.length - 1; i >= 0; i -= 1) {
    const value = points[i]?.value ?? null
    if (value !== null) {
      return { index: i, date: points[i].date, value }
    }
  }
  return null
}

function findComparison(points: ClimatePoint[], latestIndex: number, minDaySeparation: number) {
  const latestDate = new Date(points[latestIndex].date)

  for (let i = latestIndex - 1; i >= 0; i -= 1) {
    const candidate = points[i]
    if (candidate.value === null || candidate.value === undefined) continue
    const candidateDate = new Date(candidate.date)
    if (differenceInDays(latestDate, candidateDate) >= minDaySeparation) {
      return { date: candidate.date, value: candidate.value }
    }
  }

  // fallback to the most recent valid point even if separation is smaller
  for (let i = latestIndex - 1; i >= 0; i -= 1) {
    const candidate = points[i]
    if (candidate.value !== null && candidate.value !== undefined) {
      return { date: candidate.date, value: candidate.value }
    }
  }

  return null
}

function determineTrend(delta: number | null): TrendDirection {
  if (delta === null) return "flat"
  if (delta > 0.0001) return "up"
  if (delta < -0.0001) return "down"
  return "flat"
}

function differenceInDays(later: Date, earlier: Date): number {
  const msInDay = 1000 * 60 * 60 * 24
  const diff = later.getTime() - earlier.getTime()
  return Math.floor(diff / msInDay)
}

function composeHeadline(metrics: MetricSummary[]): string {
  const temp = metrics.find((metric) => metric.key === "temp")
  if (temp && temp.latestValue !== null && temp.delta !== null) {
    const formatted = formatValue(temp.latestValue, temp.unit)
    const delta = formatSigned(temp.delta, temp.unit)
    return `Global temperatures at ${formatted} (${delta} ${temp.periodLabel})`
  }

  const co2 = metrics.find((metric) => metric.key === "co2")
  if (co2 && co2.latestValue !== null && co2.delta !== null) {
    const formatted = formatValue(co2.latestValue, co2.unit)
    const delta = formatSigned(co2.delta, co2.unit)
    return `Atmospheric CO₂ at ${formatted} (${delta} ${co2.periodLabel})`
  }

  return "Weekly climate snapshot"
}

function composeSummaryText(metrics: MetricSummary[], generatedAt: string): string {
  const formatter = new Intl.DateTimeFormat("en", { dateStyle: "medium" })
  const dateLabel = formatter.format(new Date(generatedAt))

  const lines = metrics.map((metric) => {
    if (metric.latestValue === null) {
      return `${metric.label}: data unavailable`
    }
    const latest = formatValue(metric.latestValue, metric.unit)
    const delta = metric.delta !== null ? formatSigned(metric.delta, metric.unit) : "no change"
    return `${metric.label}: ${latest} (${delta} ${metric.periodLabel})`
  })

  return [`UN Climate weekly summary – ${dateLabel}.`, ...lines].join("\n")
}

function formatValue(value: number, unit: string): string {
  const rounded = Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(2)
  return unit === "%" ? `${rounded}${unit}` : `${rounded} ${unit}`
}

function formatSigned(value: number, unit: string): string {
  const sign = value > 0 ? "+" : value < 0 ? "" : ""
  const rounded = Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(2)
  const magnitude = `${sign}${rounded}`
  return unit === "%" ? `${magnitude}${unit}` : `${magnitude} ${unit}`
}
