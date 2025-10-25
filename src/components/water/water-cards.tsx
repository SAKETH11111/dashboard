import { getWaterSeriesCollection } from "@/lib/water/iowa-datasources"
import { WATER_THRESHOLDS } from "@/lib/water/thresholds"
import type { ContaminantValue, WaterSeriesResponse } from "@/types/water"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type DashboardCard = {
  contaminant: ContaminantValue
  title: string
  description: string
}

const DASHBOARD_CARDS: DashboardCard[] = [
  { contaminant: "nitrate", title: "Nitrate", description: "Monthly running average compared to the 10 mg/L MCL." },
  { contaminant: "ecoli", title: "E. coli", description: "Weekly monitoring across beaches and utility advisories." },
  { contaminant: "pfas", title: "PFAS (PFOA + PFOS)", description: "Highest detections benchmarked to the 4 ppt EPA MCL." },
  { contaminant: "arsenic", title: "Arsenic", description: "Quarterly compliance samples from community systems." },
  { contaminant: "dbp", title: "Disinfection Byproducts", description: "Locational running annual averages (TTHM)." },
  { contaminant: "fluoride", title: "Fluoride", description: "Monthly results relative to the 2 mg/L secondary standard." },
]

const STATUS_BADGES: Record<WaterSeriesResponse["status"], string> = {
  safe: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20",
  warn: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20",
  alert: "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20",
  unknown: "bg-muted text-muted-foreground border border-border",
}

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" })

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

export async function WaterCards() {
  const { data } = await getWaterSeriesCollection(DASHBOARD_CARDS.map((item) => item.contaminant))
  const byContaminant = new Map<ContaminantValue, WaterSeriesResponse>()
  data.forEach((series) => byContaminant.set(series.contaminant, series))

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      {DASHBOARD_CARDS.map((definition) => {
        const series = byContaminant.get(definition.contaminant)

        if (!series) {
          return (
            <Card key={definition.contaminant} className="border-dashed border-border/50">
              <CardHeader>
                <CardTitle>{definition.title}</CardTitle>
                <CardDescription>{definition.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No cached data yet. Run `npm run water:etl` to build the initial fixtures.
                </p>
              </CardContent>
            </Card>
          )
        }

        const latest = formatLatest(series)
        const delta = computeDelta(series)
        const threshold = WATER_THRESHOLDS[series.contaminant]
        const badgeClass = STATUS_BADGES[series.status] ?? STATUS_BADGES.unknown

        return (
          <Card key={definition.contaminant} className="border-border/70 bg-card/90 backdrop-blur">
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{definition.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{definition.description}</CardDescription>
                </div>
                <Badge className={cn("rounded-full px-3 py-1 text-xs font-semibold uppercase", badgeClass)}>
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
              <div>
                <div className="text-3xl font-semibold tracking-tight text-foreground">{latest.value}</div>
                <div className="text-xs text-muted-foreground">
                  {latest.date ? `Sampled ${dateFormatter.format(new Date(latest.date))}` : `Updated ${dateFormatter.format(new Date(series.updatedAt))}`}
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
                  <span>No recent change reported</span>
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
                <div className="mt-1">{series.source}</div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/80">{series.region}</span>
              {series.systemId ? <span>System ID: {series.systemId}</span> : null}
              <span>Updated {dateFormatter.format(new Date(series.updatedAt))}</span>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}

