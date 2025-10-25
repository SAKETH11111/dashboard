"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { IndicatorCard } from "@/components/indicator-card"
import { MetricDetailSheet, primaryMetrics } from "@/components/metric-detail-sheet"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useClimateSeries, type ClimateMetric } from "@/hooks/use-climate-series"
import { useUserPreferences } from "@/hooks/use-user-preferences"
import type { ClimatePoint } from "@/types/climate"
import type { PreferredUnits } from "@/types/user-preferences"

type ClimateMetricConfig = {
  key: ClimateMetric
  title: string
  unit: string
  progress: (value: number) => number
  changeLabel: (previousDate: string) => string
  valueFormatter: (value: number) => string
  changePrecision?: number
  cadence: "Daily" | "Monthly" | "Annual" | "Quarterly"
}

export function SectionCards() {
  const router = useRouter()
  const { preferences } = useUserPreferences()
  const co2Query = useClimateSeries("co2")
  const seaIceQuery = useClimateSeries("sea-ice")
  const tempQuery = useClimateSeries("temp")
  const seaLevelQuery = useClimateSeries("sea-level")
  const methaneQuery = useClimateSeries("methane")
  const [detailMetric, setDetailMetric] = useState<ClimateMetric>(preferences.defaultMetric as ClimateMetric)
  const [detailOpen, setDetailOpen] = useState(false)

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }),
    []
  )

  const climateCards = useMemo(
    () => [
      renderClimateCard(
        tempQuery,
        {
          key: "temp",
          title: "Global Temperature Anomaly",
          unit: "°C",
          progress: (value) => value / 1.5,
          changeLabel: () => "Since previous month",
          valueFormatter: (value) => value.toFixed(2),
          changePrecision: 2,
          cadence: "Monthly",
        },
        dateFormatter,
        preferences.units,
        () => {
          setDetailMetric("temp")
          setDetailOpen(true)
        }
      ),
    renderClimateCard(
        co2Query,
        {
          key: "co2",
          title: "Atmospheric CO₂",
          unit: "ppm",
          progress: (value) => value / 450,
          changeLabel: () => "Since previous daily reading",
          valueFormatter: (value) => value.toFixed(1),
          changePrecision: 2,
          cadence: "Daily",
        },
        dateFormatter,
        preferences.units,
        () => {
          setDetailMetric("co2")
          setDetailOpen(true)
        }
      ),
      renderClimateCard(
        seaIceQuery,
        {
          key: "sea-ice",
          title: "Arctic Sea Ice Extent",
          unit: "million km²",
          progress: (value) => value / 12,
          changeLabel: () => "Since previous observation",
          valueFormatter: (value) => value.toFixed(2),
          changePrecision: 2,
          cadence: "Daily",
        },
        dateFormatter,
        preferences.units,
        () => {
          setDetailMetric("sea-ice")
          setDetailOpen(true)
        }
      ),
      renderClimateCard(
        seaLevelQuery,
        {
          key: "sea-level",
          title: "Global Mean Sea Level",
          unit: "mm",
          progress: (value) => value / 120,
          changeLabel: () => "Since previous month",
          valueFormatter: (value) => value.toFixed(1),
          changePrecision: 1,
          cadence: "Monthly",
        },
        dateFormatter,
        preferences.units,
        () => {
          router.push("/explorer?dataset=sea_level_nasa_jpl_monthly")
        }
      ),
      renderClimateCard(
        methaneQuery,
        {
          key: "methane",
          title: "Atmospheric Methane",
          unit: "ppb",
          progress: (value) => value / 2000,
          changeLabel: () => "Since previous month",
          valueFormatter: (value) => value.toFixed(1),
          changePrecision: 1,
          cadence: "Monthly",
        },
        dateFormatter,
        preferences.units,
        () => {
          router.push("/explorer?dataset=ch4_noaa_global_monthly")
        }
      ),
    ],
    [co2Query, seaIceQuery, tempQuery, seaLevelQuery, methaneQuery, dateFormatter, router, preferences.units]
  )

  const cards = useMemo(() => [...climateCards], [climateCards])

  useEffect(() => {
    setDetailMetric(preferences.defaultMetric as ClimateMetric)
  }, [preferences.defaultMetric])

  const sortedCards = useMemo(() => {
    const priorityOrder: Record<string, number> = {
      [preferences.defaultMetric]: 0,
      temp: 1,
      co2: 2,
      "sea-ice": 3,
    }

    return [...cards].sort((a, b) => {
      const aKey = a?.props?.id ?? ""
      const bKey = b?.props?.id ?? ""
      const orderA = priorityOrder[aKey] ?? 10
      const orderB = priorityOrder[bKey] ?? 10
      return orderA - orderB
    })
  }, [cards, preferences.defaultMetric])

  return (
    <>
      <div
        id="temp"
        className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @4xl/main:grid-cols-3 @5xl/main:grid-cols-5"
      >
        {sortedCards}
      </div>
      <MetricDetailSheet
        metric={detailMetric}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        visibleMetrics={primaryMetrics}
      />
    </>
  )
}

function renderClimateCard(
  query: ReturnType<typeof useClimateSeries>,
  config: ClimateMetricConfig,
  dateFormatter: Intl.DateTimeFormat,
  units: PreferredUnits,
  onViewTrend?: () => void
) {
  const displayUnit = unitForMetric(config.key, config.unit, units)
  if (query.isLoading || !query.data) {
    return <IndicatorCardSkeleton key={`${config.key}-loading`} />
  }

  if (query.isError) {
    return (
      <section key={`${config.key}-error`} id={config.key} className="scroll-mt-24">
        <IndicatorCard
          title={config.title}
          value="--"
          unit={displayUnit}
          changeDirection="flat"
          description="Unable to load data"
          onViewTrend={onViewTrend}
        />
      </section>
    )
  }

  const { latest, previous } = extractLatestPair(query.data.points)

  if (!latest || latest.value === null) {
    return (
      <section key={`${config.key}-empty`} id={config.key} className="scroll-mt-24">
        <IndicatorCard
          title={config.title}
          value="--"
          unit={displayUnit}
          changeDirection="flat"
          description="No recent observations available"
          onViewTrend={onViewTrend}
        />
      </section>
    )
  }
  const description = `${query.data.source} • Updated ${dateFormatter.format(new Date(query.data.updatedAt))}`

  const latestDisplayValue = convertMetricValue(latest.value, config.key, units)
  const formattedDisplayValue = formatCardValue(latestDisplayValue, config.key)

  const previousDisplayValue =
    previous && previous.value !== null ? convertMetricValue(previous.value, config.key, units) : undefined
  const change =
    previousDisplayValue !== undefined ? latestDisplayValue - previousDisplayValue : undefined
  const precision = config.changePrecision ?? 2
  const roundedChange = change !== undefined ? Number(change.toFixed(precision)) : undefined
  const changeDirection = determineDirection(roundedChange)
  const changeLabel = previous ? config.changeLabel(previous.date) : undefined
  const progress = clamp(config.progress(latest.value))

  return (
    <section key={config.key} id={config.key} className="scroll-mt-24">
      <IndicatorCard
        title={config.title}
        value={formattedDisplayValue}
        unit={displayUnit}
        change={roundedChange}
        changeDirection={changeDirection}
        changeLabel={changeLabel}
        description={description}
        progress={progress}
        cadence={config.cadence}
        onViewTrend={onViewTrend}
      />
    </section>
  )
}

function extractLatestPair(points: ClimatePoint[]) {
  let latest: ClimatePoint | undefined
  let previous: ClimatePoint | undefined
  for (let i = points.length - 1; i >= 0; i--) {
    const point = points[i]
    if (point.value === null || point.value === undefined) continue
    if (!latest) {
      latest = point
      continue
    }
    previous = point
    break
  }
  return { latest, previous }
}

function determineDirection(value?: number) {
  if (value === undefined) return "flat" as const
  const threshold = 0.01
  if (value > threshold) return "up" as const
  if (value < -threshold) return "down" as const
  return "flat" as const
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max)
}

function convertMetricValue(value: number, key: ClimateMetric, units: PreferredUnits) {
  if (key === "temp" && units === "imperial") {
    return value * (9 / 5) + 32
  }
  return value
}

function unitForMetric(key: ClimateMetric, baseUnit: string, units: PreferredUnits) {
  if (key === "temp" && units === "imperial") {
    return "°F"
  }
  return baseUnit
}

function formatCardValue(value: number, key: ClimateMetric) {
  switch (key) {
    case "temp":
      return value.toFixed(2)
    case "co2":
    case "sea-level":
    case "methane":
      return value.toFixed(1)
    case "sea-ice":
    case "enso":
      return value.toFixed(2)
    case "ocean-heat":
      return value.toFixed(2)
    case "electricity-mix":
      return value.toFixed(1)
    case "forest-area":
    case "deforestation-alerts":
      return value.toFixed(0)
    default:
      return value.toString()
  }
}

function IndicatorCardSkeleton() {
  return (
    <Card className="h-full border-border">
      <CardHeader>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-2 h-8 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </CardContent>
      <CardFooter className="justify-end">
        <Skeleton className="h-6 w-20" />
      </CardFooter>
    </Card>
  )
}
