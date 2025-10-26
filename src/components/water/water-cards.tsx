"use client"

import { useState } from "react"

import { useWaterSeries } from "@/hooks/use-water-series"
import { WATER_THRESHOLDS } from "@/lib/water/thresholds"
import type { ContaminantValue, WaterSeriesResponse } from "@/types/water"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { Download } from "lucide-react"

import { WaterTrendCard } from "./water-trend-card"

type DashboardCard = {
  contaminant: ContaminantValue
  title: string
  description: string
}

const DASHBOARD_CARDS: DashboardCard[] = [
  {
    contaminant: "nitrate",
    title: "Nitrate",
    description: "Monthly running average compared to the 10 mg/L MCL.",
  },
  {
    contaminant: "ecoli",
    title: "E. coli",
    description: "Weekly monitoring across beaches and utility advisories.",
  },
  {
    contaminant: "pfas",
    title: "PFAS (PFOA + PFOS)",
    description: "Highest detections benchmarked to the 4 ppt EPA MCL.",
  },
  {
    contaminant: "arsenic",
    title: "Arsenic",
    description: "Quarterly compliance samples from community systems.",
  },
  {
    contaminant: "dbp",
    title: "Disinfection Byproducts",
    description: "Locational running annual averages (TTHM).",
  },
  {
    contaminant: "fluoride",
    title: "Fluoride",
    description: "Monthly results relative to the 2 mg/L secondary standard.",
  },
]

const STATUS_BADGES: Record<WaterSeriesResponse["status"], string> = {
  safe: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20",
  warn: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20",
  alert: "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20",
  unknown: "bg-muted text-muted-foreground border border-border/60",
}

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" })

export function WaterCards() {
  const [open, setOpen] = useState(false)
  const [activeDefinition, setActiveDefinition] = useState<DashboardCard | null>(null)
  const [activeSeries, setActiveSeries] = useState<WaterSeriesResponse | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
        {DASHBOARD_CARDS.map((definition) => (
          <WaterCard
            key={definition.contaminant}
            definition={definition}
            onSelect={(series) => {
              setActiveDefinition(definition)
              setActiveSeries(series)
              setOpen(true)
            }}
          />
        ))}
      </div>

      <WaterSeriesSheet
        open={open}
        onOpenChange={setOpen}
        definition={activeDefinition}
        series={activeSeries}
      />
    </>
  )
}

function WaterCard({
  definition,
  onSelect,
}: {
  definition: DashboardCard
  onSelect: (series: WaterSeriesResponse) => void
}) {
  const { data, isLoading, error } = useWaterSeries(definition.contaminant)

  if (isLoading) {
    return (
      <Card className="border-border/60 bg-card/80 backdrop-blur">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-4 w-24" />
        </CardFooter>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className="border-dashed border-border/50">
        <CardHeader>
          <CardTitle>{definition.title}</CardTitle>
          <CardDescription>{definition.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Unable to load data. {error instanceof Error ? error.message : "No series available."}
          </p>
        </CardContent>
      </Card>
    )
  }

  const latest = formatLatest(data)
  const delta = computeDelta(data)
  const threshold = WATER_THRESHOLDS[data.contaminant]
  const badgeClass = STATUS_BADGES[data.status] ?? STATUS_BADGES.unknown

  return (
    <Card
      key={definition.contaminant}
      className="cursor-pointer select-none border-border/70 bg-card/90 backdrop-blur transition-all hover:border-primary/40 hover:shadow-lg"
      role="button"
      tabIndex={0}
      onClick={() => onSelect(data)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect(data)
        }
      }}
    >
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-lg">{definition.title}</CardTitle>
            <CardDescription className="line-clamp-2">{definition.description}</CardDescription>
          </div>
          <Badge className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase", badgeClass)}>
            {data.status === "warn"
              ? "Monitor"
              : data.status === "alert"
                ? "Advisory"
                : data.status === "safe"
                  ? "Safe"
                  : "Unknown"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-3xl font-semibold tracking-tight text-foreground">{latest.value}</div>
          <div className="text-xs text-muted-foreground">
            {latest.date
              ? `Sampled ${dateFormatter.format(new Date(latest.date))}`
              : `Updated ${dateFormatter.format(new Date(data.updatedAt))}`}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {delta ? (
            <>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                  delta.trend === "rising"
                    ? "bg-red-500/10 text-red-700 dark:text-red-300"
                    : delta.trend === "falling"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {delta.trend === "rising" ? "Rising" : delta.trend === "falling" ? "Falling" : "Steady"}
              </span>
              <span>{delta.formatted}</span>
            </>
          ) : (
            <span>No recent change</span>
          )}
        </div>
        <div className="rounded-md border border-dashed border-border/60 bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          <div>
            <span className="font-semibold text-foreground/80">Threshold:&nbsp;</span>
            {threshold.alertLevel != null
              ? `${threshold.alertLevel} ${threshold.unit}`
              : threshold.healthAdvisory != null
                ? `${threshold.healthAdvisory} ${threshold.unit}`
                : "Not set"}
          </div>
          <div className="mt-1">{data.source}</div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-foreground/80">{data.region}</span>
        {data.systemId ? <span>System ID: {data.systemId}</span> : null}
        <span>Updated {dateFormatter.format(new Date(data.updatedAt))}</span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-7 px-2 text-xs"
          onClick={(event) => {
            event.stopPropagation()
            onSelect(data)
          }}
        >
          View details
        </Button>
      </CardFooter>
    </Card>
  )
}

function WaterSeriesSheet({
  open,
  onOpenChange,
  definition,
  series,
}: {
  open: boolean
  onOpenChange: (value: boolean) => void
  definition: DashboardCard | null
  series: WaterSeriesResponse | null
}) {
  const threshold = series ? series.threshold ?? WATER_THRESHOLDS[series.contaminant] : null
  const latest = series ? formatLatest(series) : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-xl flex-col gap-6 overflow-y-auto">
        {definition && series ? (
          <>
            <SheetHeader>
              <SheetTitle>{definition.title} details</SheetTitle>
              <SheetDescription>{definition.description}</SheetDescription>
            </SheetHeader>

            <div className="space-y-4">
              <Card className="border-border/60 bg-card/90 backdrop-blur">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{series.metric}</CardTitle>
                      <CardDescription>{series.region}</CardDescription>
                    </div>
                    <Badge className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase", STATUS_BADGES[series.status])}>
                      {series.status === "warn"
                        ? "Monitor"
                        : series.status === "alert"
                          ? "Advisory"
                          : series.status === "safe"
                            ? "Safe"
                            : "Unknown"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <div className="text-4xl font-semibold text-foreground">{latest?.value ?? "—"}</div>
                      <p className="text-xs text-muted-foreground">
                        {latest?.date
                          ? `Sampled ${dateFormatter.format(new Date(latest.date))}`
                          : `Updated ${dateFormatter.format(new Date(series.updatedAt))}`}
                      </p>
                    </div>
                    {threshold ? (
                      <div className="rounded-md border border-dashed border-border/60 bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                        <span className="font-semibold text-foreground/80">Standard:&nbsp;</span>
                        {threshold.alertLevel ?? threshold.healthAdvisory ?? threshold.mcl ?? "—"} {threshold.unit}
                      </div>
                    ) : null}
                  </div>
                  <div className="rounded-md bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                    <div className="font-medium text-foreground/80">{series.source}</div>
                    {series.sourceUrl ? (
                      <a
                        href={series.sourceUrl}
                        className="text-primary underline-offset-2 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View source documentation
                      </a>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <WaterTrendCard contaminant={series.contaminant} title={`${definition.title} trend`} />
            </div>

            <SheetFooter className="flex-col items-stretch gap-3 sm:flex-col">
              <Button
                variant="outline"
                className="justify-start"
                asChild
              >
                <a href={`/api/water/${series.contaminant}?format=csv`}>
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </a>
              </Button>
            </SheetFooter>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Select a contaminant card to view detailed trends.
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function formatLatest(series: WaterSeriesResponse) {
  const latest = [...series.points]
    .reverse()
    .find((point) => point.value !== null && point.value !== undefined)

  if (!latest || latest.value == null) {
    return { value: "—", date: series.updatedAt }
  }

  const value = latest.value
  const unit = series.unit

  let formatted: string
  if (value >= 100) {
    formatted = `${value.toFixed(0)} ${unit}`
  } else if (value >= 10) {
    formatted = `${value.toFixed(1)} ${unit}`
  } else if (value >= 1) {
    formatted = `${value.toFixed(2)} ${unit}`
  } else {
    formatted = `${value.toFixed(3)} ${unit}`
  }

  return { value: formatted, date: latest.date }
}

function computeDelta(series: WaterSeriesResponse) {
  if (series.points.length < 2) return null
  const sorted = series.points.filter((point) => typeof point.value === "number") as Array<{
    date: string
    value: number
  }>

  if (sorted.length < 2) return null
  const latest = sorted.at(-1)!
  const previous = sorted.at(-2)!
  const delta = latest.value - previous.value

  if (Number.isNaN(delta)) return null

  return {
    delta,
    formatted:
      delta === 0
        ? "No change"
        : `${delta > 0 ? "+" : "−"}${Math.abs(delta).toFixed(Math.abs(delta) >= 1 ? 1 : 2)} ${series.unit}`,
    trend: delta === 0 ? "steady" : delta > 0 ? "rising" : "falling",
  }
}
