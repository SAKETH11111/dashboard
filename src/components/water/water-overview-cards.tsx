import { getIowaArsenicSeries, getIowaBacteriaSeries, getIowaNitrateSeries, getIowaPfasSeries, getLatestWaterPoint } from "@/lib/water/iowa-datasources"
import { WATER_THRESHOLDS } from "@/lib/water/thresholds"
import type { WaterSeriesResponse } from "@/types/water"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const STATUS_COLOR_MAP: Record<string, string> = {
  safe: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",
  warn: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30",
  alert: "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30",
  unknown: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/30",
}

const SUMMARY_CARDS = [
  {
    id: "nitrate",
    title: "Nitrate",
    subtitle: "Public drinking water compliance sampling",
    load: getIowaNitrateSeries,
  },
  {
    id: "ecoli",
    title: "E. coli",
    subtitle: "Beach monitoring and boil advisories",
    load: getIowaBacteriaSeries,
  },
  {
    id: "pfas",
    title: "PFAS",
    subtitle: "PFOA + PFOS vs. EPA 4 ppt MCL",
    load: getIowaPfasSeries,
  },
  {
    id: "arsenic",
    title: "Arsenic",
    subtitle: "Running averages across groundwater systems",
    load: getIowaArsenicSeries,
  },
]

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" })

function getStatusCopy(series: WaterSeriesResponse) {
  const threshold = WATER_THRESHOLDS[series.contaminant]
  const copyMap = {
    safe: threshold.safeCopy,
    warn: threshold.warnCopy,
    alert: threshold.alertCopy,
    unknown: "Awaiting recent samples. Check utility updates for new results.",
  }
  return copyMap[series.status] ?? copyMap.unknown
}

function formatValue(series: WaterSeriesResponse) {
  const latest = series.points
    .slice()
    .reverse()
    .find((point) => point.value !== null && point.value !== undefined)

  if (!latest || latest.value === null) {
    return { value: "—", updated: series.updatedAt ? dateFormatter.format(new Date(series.updatedAt)) : null }
  }

  const unit = series.unit
  const numeric = latest.value

  let formattedValue: string
  if (numeric >= 100) {
    formattedValue = `${numeric.toFixed(0)} ${unit}`
  } else if (numeric >= 10) {
    formattedValue = `${numeric.toFixed(1)} ${unit}`
  } else if (numeric >= 1) {
    formattedValue = `${numeric.toFixed(2)} ${unit}`
  } else {
    formattedValue = `${numeric.toFixed(3)} ${unit}`
  }

  return {
    value: formattedValue,
    updated: latest.date ? dateFormatter.format(new Date(latest.date)) : null,
  }
}

export async function WaterOverviewCards() {
  const series = await Promise.all(
    SUMMARY_CARDS.map(async (definition) => {
      const data = await definition.load()
      const latest = getLatestWaterPoint(data)
      return {
        definition,
        series: data,
        latestDate: latest?.date ?? data.updatedAt,
        formatted: formatValue(data),
      }
    }),
  )

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @4xl/main:grid-cols-4">
      {series.map(({ definition, series: record, formatted }) => (
        <Card key={definition.id} className="border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-lg">{definition.title}</CardTitle>
                <CardDescription className="line-clamp-2">{definition.subtitle}</CardDescription>
              </div>
              <span
                className={cn(
                  "inline-flex min-w-[82px] items-center justify-center rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-wide",
                  STATUS_COLOR_MAP[record.status] ?? STATUS_COLOR_MAP.unknown,
                )}
              >
                {record.status === "warn"
                  ? "Monitor"
                  : record.status === "alert"
                    ? "Advisory"
                    : record.status === "safe"
                      ? "Safe"
                      : "Unknown"}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <div className="text-3xl font-semibold tracking-tight text-foreground">{formatted.value}</div>
              <div className="text-xs text-muted-foreground">
                {formatted.updated ? `Sampled ${formatted.updated}` : `Updated ${dateFormatter.format(new Date(record.updatedAt))}`}
              </div>
            </div>
            <div className="h-px w-full bg-border/70" />
            <p className="text-sm leading-relaxed text-muted-foreground">{getStatusCopy(record)}</p>
            <div className="rounded-md bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
              <div className="font-medium text-foreground/80">{record.region}</div>
              <div>{record.source}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
