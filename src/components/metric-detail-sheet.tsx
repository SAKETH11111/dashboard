"use client"

import * as React from "react"
import { differenceInCalendarDays, format } from "date-fns"
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts"

import { useClimateSeries } from "@/hooks/use-climate-series"
import { useUserPreferences } from "@/hooks/use-user-preferences"
import type { ClimatePoint } from "@/types/climate"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Toggle } from "@/components/ui/toggle"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { DateRange } from "react-day-picker"
import type { PreferredUnits } from "@/types/user-preferences"

const defaultMetric: MetricKey = "temp"

type MetricKey =
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

export const primaryMetrics: readonly MetricKey[] = ["temp", "co2", "sea-ice"]

export type MetricConfig = {
  key: MetricKey
  title: string
  unit: string
  description: string
  color: string
  smoothColor?: string
  formatter?: (value: number) => string
  yFormatter?: (value: number) => string
  smoothingWindow?: number
  smoothingLabel?: string
  baseline?: {
    value: number
    label: string
  }
  yDomain?: [number | "auto", number | "auto"]
}

export const metrics: MetricConfig[] = [
  {
    key: "temp",
    title: "Temperature Anomaly",
    unit: "°C",
    description: "Global mean surface temperature anomaly",
    color: "var(--chart-1)",
    smoothColor: "var(--chart-3)",
    formatter: (value) => `${value.toFixed(2)} °C`,
    yFormatter: (value) => value.toFixed(1),
    smoothingWindow: 3,
    smoothingLabel: "3-month avg",
    baseline: {
      value: 0,
      label: "1951–1980 baseline",
    },
    yDomain: [-0.6, 1.6], // Sensible range for temperature anomaly
  },
  {
    key: "co2",
    title: "Atmospheric CO₂",
    unit: "ppm",
    description: "Daily mean concentration (Mauna Loa)",
    color: "var(--chart-2)",
    smoothColor: "var(--chart-4)",
    formatter: (value) => `${value.toFixed(1)} ppm`,
    yFormatter: (value) => value.toFixed(0),
    smoothingWindow: 30,
    smoothingLabel: "30-day avg",
    baseline: {
      value: 350,
      label: "350 ppm (target)",
    },
    yDomain: [360, 460], // Historical range + headroom for rising CO₂
  },
  {
    key: "sea-ice",
    title: "Arctic Sea Ice",
    unit: "million km²",
    description: "Extent of Arctic sea ice",
    color: "var(--chart-3)",
    smoothColor: "var(--chart-5)",
    formatter: (value) => `${value.toFixed(2)} M km²`,
    yFormatter: (value) => value.toFixed(1),
    smoothingWindow: 14,
    smoothingLabel: "14-day avg",
    yDomain: [2, 16], // Arctic sea ice extent typical range
  },
  {
    key: "sea-level",
    title: "Global Mean Sea Level",
    unit: "mm",
    description: "Satellite altimetry derived sea level anomaly",
    color: "var(--chart-4)",
    smoothColor: "var(--chart-2)",
    formatter: (value) => `${value.toFixed(1)} mm`,
    yFormatter: (value) => value.toFixed(0),
    smoothingWindow: 3,
    smoothingLabel: "3-month avg",
    baseline: {
      value: 0,
      label: "1993 baseline",
    },
    yDomain: [-20, 120],
  },
  {
    key: "methane",
    title: "Atmospheric Methane",
    unit: "ppb",
    description: "Globally averaged methane concentration",
    color: "var(--chart-5)",
    smoothColor: "var(--chart-1)",
    formatter: (value) => `${value.toFixed(1)} ppb`,
    yFormatter: (value) => value.toFixed(0),
    smoothingWindow: 3,
    smoothingLabel: "3-month avg",
    baseline: {
      value: 1800,
      label: "Pre-2000 baseline",
    },
    yDomain: [1700, 2050],
  },
  {
    key: "enso",
    title: "ENSO Index (Niño 3.4)",
    unit: "°C anomaly",
    description: "Sea surface temperature anomaly over the Niño 3.4 region",
    color: "var(--chart-2)",
    smoothColor: "var(--chart-4)",
    formatter: (value) => `${value.toFixed(2)} °C`,
    yFormatter: (value) => value.toFixed(1),
    smoothingWindow: 3,
    smoothingLabel: "3-month avg",
    baseline: {
      value: 0,
      label: "Neutral ENSO",
    },
    yDomain: [-3, 3],
  },
  {
    key: "ocean-heat",
    title: "Ocean Heat Content (0–700m)",
    unit: "10^22 J",
    description: "Global ocean heat content anomaly for the upper 700m",
    color: "var(--chart-3)",
    smoothColor: "var(--chart-5)",
    formatter: (value) => `${value.toFixed(2)} x10^22 J`,
    yFormatter: (value) => value.toFixed(1),
    baseline: {
      value: 0,
      label: "1955–2006 baseline",
    },
  },
  {
    key: "electricity-mix",
    title: "Global Electricity from Renewables",
    unit: "%",
    description: "Share of global electricity generated from renewables",
    color: "var(--chart-1)",
    smoothColor: "var(--chart-2)",
    formatter: (value) => `${value.toFixed(1)} %`,
    yFormatter: (value) => value.toFixed(0),
    smoothingWindow: 3,
    smoothingLabel: "3-year avg",
    baseline: {
      value: 0,
      label: "Baseline",
    },
    yDomain: [0, 60],
  },
  {
    key: "forest-area",
    title: "Global Forest Area",
    unit: "million ha",
    description: "FAO Forest Resources Assessment global forest area estimate",
    color: "var(--chart-4)",
    smoothColor: "var(--chart-5)",
    formatter: (value) => `${value.toFixed(0)} million ha`,
    yFormatter: (value) => value.toFixed(0),
    smoothingWindow: 5,
    smoothingLabel: "5-year avg",
    baseline: {
      value: 4000,
      label: "1990 benchmark",
    },
    yDomain: [3600, 4200],
  },
  {
    key: "deforestation-alerts",
    title: "Daily Deforestation Alerts",
    unit: "alerts",
    description: "Global forest loss alerts aggregated daily (GFW sample)",
    color: "var(--chart-2)",
    smoothColor: "var(--chart-3)",
    formatter: (value) => `${value.toFixed(0)} alerts`,
    yFormatter: (value) => value.toFixed(0),
    smoothingWindow: 7,
    smoothingLabel: "7-day avg",
    yDomain: [0, 12000],
  },
]

function convertMetricValueToDisplay(
  value: number,
  key: MetricKey,
  units: PreferredUnits
) {
  if (key === "temp" && units === "imperial") {
    return value * (9 / 5) + 32
  }
  return value
}

function getMetricUnitForDisplay(
  config: MetricConfig,
  units: PreferredUnits
) {
  if (config.key === "temp" && units === "imperial") {
    return "°F"
  }
  return config.unit
}

function formatMetricValueForDisplay(
  value: number,
  config: MetricConfig,
  units: PreferredUnits
) {
  if (config.key === "temp" && units === "imperial") {
    return `${value.toFixed(2)} ${getMetricUnitForDisplay(config, units)}`
  }
  return config.formatter
    ? config.formatter(value)
    : `${value} ${getMetricUnitForDisplay(config, units)}`
}

export function MetricDetailSheet({
  metric = defaultMetric,
  open,
  onOpenChange,
  visibleMetrics,
}: {
  metric?: MetricKey
  open: boolean
  onOpenChange: (open: boolean) => void
  visibleMetrics?: readonly MetricKey[]
}) {
  const { preferences } = useUserPreferences()
  const allowedMetrics = React.useMemo(() => {
    const keys = visibleMetrics ?? primaryMetrics
    const knownKeys = new Set(metrics.map((config) => config.key))
    return keys.filter((key) => knownKeys.has(key))
  }, [visibleMetrics])
  const allowedSet = React.useMemo(() => new Set(allowedMetrics), [allowedMetrics])
  const visibleConfigs = React.useMemo(
    () => metrics.filter((config) => allowedSet.has(config.key)),
    [allowedSet]
  )
  const fallbackMetric = React.useMemo(
    () => visibleConfigs[0]?.key ?? metrics[0].key,
    [visibleConfigs]
  )
  const [selectedMetric, setSelectedMetric] = React.useState<MetricKey>(
    allowedSet.has(metric ?? preferences.defaultMetric)
      ? ((metric ?? preferences.defaultMetric) as MetricKey)
      : fallbackMetric
  )
  const [range, setRange] = React.useState<RangeKey>("5y")
  const [customRange, setCustomRange] = React.useState<DateRange>({ from: undefined, to: undefined })
  const [smooth, setSmooth] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      const desired = (metric ?? preferences.defaultMetric) as MetricKey
      setSelectedMetric(allowedSet.has(desired) ? desired : fallbackMetric)
    }
  }, [metric, open, preferences.defaultMetric, allowedSet, fallbackMetric])

  const activeConfig = React.useMemo(
    () => visibleConfigs.find((item) => item.key === selectedMetric) ?? visibleConfigs[0] ?? metrics[0],
    [selectedMetric, visibleConfigs]
  )

  const smoothingLabel = React.useMemo(
    () => getSmoothingLabel(activeConfig),
    [activeConfig]
  )

  React.useEffect(() => {
    if (range !== "custom" && (customRange.from || customRange.to)) {
      setCustomRange({ from: undefined, to: undefined })
    }
  }, [range, customRange.from, customRange.to])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="overflow-hidden px-0"
        resizable
        defaultWidth={840}
        minWidth={560}
        maxWidth={1120}
        storageKey="metric-detail-width"
      >
        <SheetHeader className="px-6">
          <SheetTitle>Detailed Analysis</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          <Tabs
            value={selectedMetric}
            onValueChange={(value) => setSelectedMetric((value as MetricKey) ?? fallbackMetric)}
          >
            <TabsList className="w-full justify-start overflow-x-auto">
              {visibleConfigs.map((config) => (
                <TabsTrigger
                  key={config.key}
                  value={config.key}
                className={cn(
                  "whitespace-nowrap rounded-md border border-input bg-background text-sm font-medium",
                  "transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
                  "data-[state=active]:border-transparent data-[state=active]:bg-[var(--accent)] data-[state=active]:text-[var(--accent-foreground)] data-[state=active]:shadow-sm"
                )}
                >
                  {config.title}
                </TabsTrigger>
              ))}
            </TabsList>
            {visibleConfigs.map((config) => (
              <TabsContent key={config.key} value={config.key} className="mt-4">
                <MetricPanel
                  config={config}
                  range={range}
                  customRange={customRange}
                  smooth={smooth}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
        <SheetFooter className="flex flex-col items-start gap-2 px-6 pb-6">
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <RangeSelector
              value={range}
              onChange={setRange}
              customRange={customRange}
              onCustomRangeChange={(next) => setCustomRange(next ?? { from: undefined, to: undefined })}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Toggle
                  pressed={smooth}
                  onPressedChange={setSmooth}
                  aria-label="Toggle smoothing"
                  variant="outline"
                  className="text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground data-[state=on]:bg-accent data-[state=on]:text-accent-foreground data-[state=on]:border-transparent"
                >
                  {smoothingLabel}
                </Toggle>
              </TooltipTrigger>
              <TooltipContent side="top">Toggle rolling average line</TooltipContent>
            </Tooltip>
          </div>
          <div className="flex w-full items-center justify-between gap-3">
            <Badge variant="outline" className="text-xs font-normal">
              CSV exports truncate to current range
            </Badge>
            <Button
              variant="outline"
              className="border-border transition-colors hover:bg-accent hover:text-accent-foreground"
              onClick={() => downloadCsv(selectedMetric, range, customRange)}
            >
              Download CSV
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export type RangeKey =
  | "1m"
  | "3m"
  | "6m"
  | "1y"
  | "2y"
  | "3y"
  | "5y"
  | "10y"
  | "15y"
  | "20y"
  | "all"
  | "custom"

export function MetricPanel({
  config,
  range,
  customRange,
  smooth,
}: {
  config: MetricConfig
  range: RangeKey
  customRange?: DateRange | null
  smooth: boolean
}) {
  const { preferences } = useUserPreferences()
  const units = preferences.units
  const query = useClimateSeries(config.key)
  const smoothingName = React.useMemo(
    () => getSmoothingLabel(config),
    [config]
  )
  const chartConfig = React.useMemo(() => {
    const base: Record<string, { label: string; color?: string }> = {
      value: {
        label: "Raw data",
        color: config.color,
      },
    }
    if (config.smoothingWindow) {
      base.smoothed = {
        label: smoothingName,
        color: config.smoothColor,
      }
    }
    return base
  }, [config.color, config.smoothColor, config.smoothingWindow, smoothingName])
  const dateFormatter = React.useMemo(() => {
    let shortRange = range === "1m" || range === "3m" || range === "6m"
    if (range === "custom" && customRange?.from && customRange?.to) {
      const spanDays = Math.abs(
        differenceInCalendarDays(customRange.to, customRange.from)
      )
      shortRange = spanDays <= 183
    }
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: shortRange ? "numeric" : undefined,
      year: "numeric",
    })
  }, [range, customRange])

  const { data, latest, previous, smoothed } = React.useMemo(() => {
    if (!query.data) {
      return { data: [], latest: null, previous: null, smoothed: [] as { date: string; value: number }[] }
    }
    const filtered = filterPoints(query.data.points, range, customRange)
    const downsampled = downsample(filtered, 360)
    const data = downsampled.map((point) => ({
      date: point.date,
      label: dateFormatter.format(new Date(point.date)),
      value: convertMetricValueToDisplay(point.value as number, config.key, units),
    }))
    const latest = filtered.slice().reverse().find((pt) => pt.value !== null) ?? null
    const previous = filtered
      .slice(0, -1)
      .reverse()
      .find((pt) => pt.value !== null) ?? null
    const windowSize = Math.max(1, Math.round(config.smoothingWindow ?? 30))
    const smoothedSeries = config.smoothingWindow
      ? movingAverage(data, windowSize)
      : []
    return { data, latest, previous, smoothed: smoothedSeries }
  }, [query.data, range, customRange, dateFormatter, config, units])

  const chartData = React.useMemo(() => {
    if (!smooth || !smoothed.length) {
      return data
    }
    const smoothedMap = new Map(smoothed.map((pt) => [pt.date, pt.value]))
    return data.map((pt) => ({
      ...pt,
      smoothed: smoothedMap.get(pt.date) ?? null,
    }))
  }, [data, smooth, smoothed])

  const latestDisplay =
    latest && latest.value !== null
      ? convertMetricValueToDisplay(latest.value, config.key, units)
      : undefined
  const previousDisplay =
    previous && previous.value !== null
      ? convertMetricValueToDisplay(previous.value, config.key, units)
      : undefined
  const delta =
    latestDisplay !== undefined && previousDisplay !== undefined
      ? latestDisplay - previousDisplay
      : undefined
  const trend = delta !== undefined ? (delta > 0 ? "up" : delta < 0 ? "down" : "flat") : "flat"
  const latestPoint = data.length ? data[data.length - 1] : null
  const baselineValue =
    config.baseline && typeof config.baseline.value === "number"
      ? convertMetricValueToDisplay(config.baseline.value, config.key, units)
      : undefined
  const yDomain = React.useMemo(() => {
    if (!config.yDomain) return undefined
    if (config.key === "temp" && units === "imperial") {
      return config.yDomain.map((bound) =>
        typeof bound === "number"
          ? convertMetricValueToDisplay(bound, config.key, units)
          : bound
      ) as typeof config.yDomain
    }
    return config.yDomain
  }, [config, units])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-medium leading-tight">{config.title}</h3>
          <p className="text-sm text-muted-foreground">{query.data?.source ?? config.description}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold tabular-nums">
            {latestDisplay !== undefined
              ? formatMetricValueForDisplay(latestDisplay, config, units)
              : "--"}
          </div>
          <div className="text-xs text-muted-foreground">
            Updated {latest?.date ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(latest.date)) : "--"}
          </div>
          {delta !== undefined && (
            <div className="text-xs text-muted-foreground">
              Change vs previous: {delta > 0 ? "+" : ""}
              {formatMetricValueForDisplay(delta, config, units)} ({trend})
            </div>
          )}
          {config.smoothingWindow && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="mt-1 inline-block cursor-help text-xs text-muted-foreground">
                  {smoothingName}
                </span>
              </TooltipTrigger>
              <TooltipContent side="left">Toggle shows rolling average line</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      {query.isLoading ? (
        <LargeChartSkeleton />
      ) : query.isError ? (
        <ChartError message="Failed to load data" />
      ) : data.length ? (
        <ChartContainer className="h-[360px] w-full" config={chartConfig}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: 16, right: 16, top: 20, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} minTickGap={28} />
              <YAxis
                width={48}
                tickFormatter={config.yFormatter}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                domain={yDomain ?? config.yDomain}
              />
              <ChartTooltip
                cursor={{ strokeDasharray: "4 4" }}
                content={
                  <ChartTooltipContent
                    className="min-w-[200px]"
                    indicator="dot"
                    formatter={(value) => {
                      const numericValue = typeof value === "number" ? value : Number(value)
                      if (!Number.isFinite(numericValue)) return ""
                      return formatMetricValueForDisplay(numericValue, config, units)
                    }}
                  />
                }
              />
              {baselineValue !== undefined && (
                <ReferenceLine
                  y={baselineValue}
                  stroke="hsl(var(--accent))"
                  strokeDasharray="4 4"
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke={config.color}
                strokeWidth={2}
                dot={false}
                name="Raw data"
                connectNulls
              />
              {config.smoothingWindow && (
                <Line
                  type="monotone"
                  dataKey="smoothed"
                  stroke={config.smoothColor ?? "var(--chart-2)"}
                  strokeWidth={2}
                  dot={false}
                  name={smoothingName}
                  strokeDasharray="6 3"
                  connectNulls
                  hide={!smooth}
                />
              )}
              <ChartLegend
                verticalAlign="top"
                content={<ChartLegendContent className="justify-end gap-4 text-xs" />}
              />
              {latestPoint && (
                <ReferenceDot
                  x={latestPoint.label}
                  y={latestPoint.value}
                  r={4}
                  fill="var(--accent)"
                  stroke="var(--background)"
                  strokeWidth={2}
                  label={{
                    value: formatMetricValueForDisplay(latestPoint.value, config, units),
                    position: "top",
                    fill: "hsl(var(--foreground))",
                    fontSize: 11,
                  }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      ) : (
        <ChartError message="No data in selected range" />
      )}
    </div>
  )
}

function filterPoints(
  points: ClimatePoint[],
  range: RangeKey,
  customRange?: DateRange | null
) {
  const valid = points.filter((pt) => pt.value !== null)
  if (!valid.length) return []

  const sorted = [...valid].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  if (range === "all") {
    return sorted
  }

  if (range === "custom") {
    if (!customRange?.from || !customRange?.to) {
      return []
    }
    const start = new Date(
      Math.min(customRange.from.getTime(), customRange.to.getTime())
    )
    const end = new Date(
      Math.max(customRange.from.getTime(), customRange.to.getTime())
    )
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)

    return sorted.filter((pt) => {
      const date = new Date(pt.date)
      return date >= start && date <= end
    })
  }

  const reference = new Date(sorted[sorted.length - 1].date)
  reference.setHours(0, 0, 0, 0)
  let cutoff: Date

  switch (range) {
    case "1m":
      cutoff = subtractMonths(reference, 1)
      break
    case "3m":
      cutoff = subtractMonths(reference, 3)
      break
    case "6m":
      cutoff = subtractMonths(reference, 6)
      break
    case "1y":
      cutoff = subtractYears(reference, 1)
      break
    case "2y":
      cutoff = subtractYears(reference, 2)
      break
    case "3y":
      cutoff = subtractYears(reference, 3)
      break
    case "5y":
      cutoff = subtractYears(reference, 5)
      break
    case "10y":
      cutoff = subtractYears(reference, 10)
      break
    case "15y":
      cutoff = subtractYears(reference, 15)
      break
    case "20y":
      cutoff = subtractYears(reference, 20)
      break
    default:
      cutoff = subtractYears(reference, 1)
      break
  }

  return sorted.filter((pt) => {
    const date = new Date(pt.date)
    date.setHours(0, 0, 0, 0)
    return date >= cutoff
  })
}

function downsample(points: ClimatePoint[], maxPoints: number) {
  if (points.length <= maxPoints) return points
  const step = Math.ceil(points.length / maxPoints)
  const result: ClimatePoint[] = []
  for (let i = 0; i < points.length; i += step) {
    result.push(points[i])
  }
  return result
}

function subtractMonths(date: Date, months: number) {
  const next = new Date(date)
  next.setMonth(next.getMonth() - months)
  next.setHours(0, 0, 0, 0)
  return next
}

function subtractYears(date: Date, years: number) {
  const next = new Date(date)
  next.setFullYear(next.getFullYear() - years)
  next.setHours(0, 0, 0, 0)
  return next
}

function movingAverage(pts: { date: string; value: number }[], windowSize: number) {
  const result: { date: string; value: number }[] = []
  for (let i = 0; i < pts.length; i++) {
    const window = pts.slice(Math.max(0, i - windowSize + 1), i + 1)
    if (window.length < windowSize) continue
    const sum = window.reduce((acc, point) => acc + point.value, 0)
    result.push({ date: pts[i].date, value: sum / window.length })
  }
  return result
}

function downloadCsv(
  metric: MetricKey,
  range: RangeKey,
  customRange?: DateRange | null
) {
  fetch(`/api/climate/${metric}`)
    .then((res) => res.json())
    .then((json) => {
      const points: ClimatePoint[] = json.points
      const filtered = filterPoints(points, range, customRange)
      const header = "date,value\n"
      const rows = filtered
        .map((pt) => `${pt.date},${pt.value ?? ""}`)
        .join("\n")
      const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${metric}-${range}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    })
    .catch((error) => {
      console.error("Failed to export CSV", error)
    })
}

export function getSmoothingLabel(config?: MetricConfig) {
  if (!config) return "Smoothing"
  if (config.smoothingLabel) return config.smoothingLabel
  if (!config.smoothingWindow) return "Rolling avg"
  if (config.key === "temp") {
    return `${config.smoothingWindow}-month avg`
  }
  return `${config.smoothingWindow}-day avg`
}

export function RangeSelector({
  value,
  onChange,
  allowedRanges,
  customRange,
  onCustomRangeChange,
}: {
  value: RangeKey
  onChange: (value: RangeKey) => void
  allowedRanges?: RangeKey[]
  customRange?: DateRange | null
  onCustomRangeChange?: (range: DateRange | null) => void
}) {
  const allOptions: { label: string; value: RangeKey }[] = [
    { label: "1 Month", value: "1m" },
    { label: "3 Months", value: "3m" },
    { label: "6 Months", value: "6m" },
    { label: "1 Year", value: "1y" },
    { label: "2 Years", value: "2y" },
    { label: "3 Years", value: "3y" },
    { label: "5 Years", value: "5y" },
    { label: "10 Years", value: "10y" },
    { label: "15 Years", value: "15y" },
    { label: "20 Years", value: "20y" },
    { label: "All", value: "all" },
    { label: "Custom", value: "custom" },
  ]
  const options = allowedRanges
    ? allOptions.filter((option) => allowedRanges.includes(option.value))
    : allOptions
  const presets = options.filter((option) => option.value !== "custom")
  const supportsCustom = options.some((option) => option.value === "custom")
  const fallbackPreset = presets[0]?.value ?? value
  const customLabel =
    customRange?.from && customRange?.to
      ? `${format(customRange.from, "MMM d, yyyy")} – ${format(customRange.to, "MMM d, yyyy")}`
      : "Custom range"
  const [customOpen, setCustomOpen] = React.useState(false)
  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((option) => (
        <Tooltip key={option.value}>
          <TooltipTrigger asChild>
            <Button
              key={option.value}
              variant="outline"
              size="sm"
                className={cn(
                  "border border-input bg-background shadow-xs transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
                  option.value === value && "!border-transparent !bg-[var(--accent)] !text-[var(--accent-foreground)] shadow-sm"
                )}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{`Preview last ${option.label.toLowerCase()}`}</TooltipContent>
        </Tooltip>
      ))}
      {supportsCustom ? (
        <Popover open={customOpen} onOpenChange={setCustomOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "border border-input bg-background shadow-xs transition-colors hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]",
                value === "custom" && "!border-transparent !bg-[var(--accent)] !text-[var(--accent-foreground)] shadow-sm"
              )}
            >
              {customLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={customRange ?? { from: undefined, to: undefined }}
              defaultMonth={customRange?.from ?? new Date()}
              onSelect={(range) => {
                onCustomRangeChange?.(range ?? null)
                if (range?.from && range?.to) {
                  onChange("custom")
                  setCustomOpen(false)
                }
              }}
            />
            <div className="mt-3 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onCustomRangeChange?.(null)
                  onChange(fallbackPreset)
                  setCustomOpen(false)
                }}
              >
                Clear
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  )
}

function ChartError({ message }: { message: string }) {
  return (
    <div className="flex h-[360px] items-center justify-center rounded border border-dashed text-sm text-muted-foreground">
      {message}
    </div>
  )
}

function LargeChartSkeleton() {
  return (
    <div className="flex h-[360px] flex-col justify-between">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-[300px]" />
    </div>
  )
}
