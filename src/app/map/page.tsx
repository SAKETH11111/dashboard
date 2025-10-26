"use client"

import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { Info, Layers, MapPin } from "lucide-react"

import { WATER_SYSTEMS } from "@/data/water-systems"
import { AppSidebar } from "@/components/app-sidebar"
import { WaterMap } from "@/components/map/water-map"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  LocationPicker,
  useLocationPreference,
} from "@/components/water/location-picker"
import { useWaterSeries } from "@/hooks/use-water-series"
import { WATER_THRESHOLDS } from "@/lib/water/thresholds"
import type { ContaminantValue, WaterSeriesResponse, WaterStatus, WaterSystem } from "@/types/water"
import { Contaminant } from "@/types/water"

type MapFilters = {
  systemType: "drinking" | "recreational" | "all"
  status: WaterStatus | "all"
  contaminant: ContaminantValue | "all"
}

type SystemMetric = {
  contaminant: ContaminantValue
  label: string
  status: WaterStatus
  latestValue: number | null
  latestDate: string | null
  unit: string
  thresholdValue?: number | null
  thresholdUnit?: string
  source: string
  sourceUrl?: string
  series: WaterSeriesResponse
}

type SystemWithMetrics = WaterSystem & {
  metrics: SystemMetric[]
}

const STATUS_BADGE_VARIANTS: Record<WaterStatus, "default" | "secondary" | "destructive" | "outline"> = {
  safe: "default",
  warn: "secondary",
  alert: "destructive",
  unknown: "outline",
}

const STATUS_COLORS: Record<Exclude<WaterStatus, "unknown">, string> = {
  safe: "#10b981",
  warn: "#f59e0b",
  alert: "#ef4444",
}

const sidebarStyle = {
  "--header-height": "calc(var(--spacing) * 12)",
} as CSSProperties

export default function MapPage() {
  const [filters, setFilters] = useState<MapFilters>({
    systemType: "all",
    status: "all",
    contaminant: "all",
  })
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null)
  const [showLegend, setShowLegend] = useState(true)
  const { location, setLocation } = useLocationPreference()

  const nitrateQuery = useWaterSeries(Contaminant.NITRATE)
  const nitriteQuery = useWaterSeries(Contaminant.NITRITE)
  const bacteriaQuery = useWaterSeries(Contaminant.ECOLI)
  const pfasQuery = useWaterSeries(Contaminant.PFAS)
  const arsenicQuery = useWaterSeries(Contaminant.ARSENIC)
  const dbpQuery = useWaterSeries(Contaminant.DBP)
  const fluorideQuery = useWaterSeries(Contaminant.FLUORIDE)

  const seriesByContaminant = useMemo(() => {
    const map = new Map<ContaminantValue, WaterSeriesResponse>()
    if (nitrateQuery.data) map.set(Contaminant.NITRATE, nitrateQuery.data)
    if (nitriteQuery.data) map.set(Contaminant.NITRITE, nitriteQuery.data)
    if (bacteriaQuery.data) map.set(Contaminant.ECOLI, bacteriaQuery.data)
    if (pfasQuery.data) map.set(Contaminant.PFAS, pfasQuery.data)
    if (arsenicQuery.data) map.set(Contaminant.ARSENIC, arsenicQuery.data)
    if (dbpQuery.data) map.set(Contaminant.DBP, dbpQuery.data)
    if (fluorideQuery.data) map.set(Contaminant.FLUORIDE, fluorideQuery.data)
    return map
  }, [
    nitrateQuery.data,
    nitriteQuery.data,
    bacteriaQuery.data,
    pfasQuery.data,
    arsenicQuery.data,
    dbpQuery.data,
    fluorideQuery.data,
  ])

  const seriesQueries = [
    nitrateQuery,
    nitriteQuery,
    bacteriaQuery,
    pfasQuery,
    arsenicQuery,
    dbpQuery,
    fluorideQuery,
  ]

  const seriesError = seriesQueries.find((query) => query.error)?.error
  const seriesErrorMessage =
    seriesError instanceof Error
      ? seriesError.message
      : seriesError
        ? String(seriesError)
        : null

  const systemsWithMetrics = useMemo<SystemWithMetrics[]>(() => {
    return WATER_SYSTEMS.map((system) => {
      const metrics = system.contaminants
        .map((reference) => {
          const series = seriesByContaminant.get(reference.id)
          if (!series) return null
          if (!matchesReference(reference, series)) return null

          const latestPoint = getLatestPoint(series)
          const threshold = series.threshold ?? WATER_THRESHOLDS[series.contaminant]
          const thresholdValue =
            threshold?.alertLevel ?? threshold?.healthAdvisory ?? threshold?.mcl ?? null

          return {
            contaminant: series.contaminant,
            label: reference.label ?? series.metric,
            status: series.status,
            latestValue: latestPoint?.value ?? null,
            latestDate: latestPoint?.date ?? series.updatedAt ?? null,
            unit: series.unit,
            thresholdValue,
            thresholdUnit: threshold?.unit ?? series.unit,
            source: series.source,
            sourceUrl: series.sourceUrl,
            series,
          } satisfies SystemMetric
        })
        .filter(Boolean) as SystemMetric[]

      return {
        ...system,
        status: deriveSystemStatus(system.status, metrics),
        metrics,
      }
    })
  }, [seriesByContaminant])

  const selectedSystem = useMemo(
    () => systemsWithMetrics.find((system) => system.id === selectedSystemId) ?? null,
    [systemsWithMetrics, selectedSystemId],
  )

  const filteredSystems = useMemo(() => {
    return systemsWithMetrics.filter((system) => {
      if (filters.systemType !== "all" && system.type !== filters.systemType) return false
      if (filters.status !== "all" && system.status !== filters.status) return false
      if (
        filters.contaminant !== "all" &&
        !system.metrics.some((metric) => metric.contaminant === filters.contaminant)
      ) {
        return false
      }
      if (location) {
        const target = location.name.toLowerCase()
        const matchesName = system.name.toLowerCase().includes(target)
        const matchesId = system.id.toLowerCase().includes(target)
        if (!matchesName && !matchesId) return false
      }
      return true
    })
  }, [systemsWithMetrics, filters, location])

  useEffect(() => {
    if (selectedSystemId && !filteredSystems.some((system) => system.id === selectedSystemId)) {
      setSelectedSystemId(null)
    }
  }, [filteredSystems, selectedSystemId])

  const mapCenter = useMemo(() => {
    if (selectedSystem?.location) {
      return [selectedSystem.location.lng, selectedSystem.location.lat] as [number, number]
    }
    if (location?.coordinates) {
      return [location.coordinates.lng, location.coordinates.lat] as [number, number]
    }
    return undefined
  }, [selectedSystem, location])

  return (
    <SidebarProvider style={sidebarStyle}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
            <header className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/70">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight">Water Quality Map</h1>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Explore Iowa water systems and recreational sites. Click markers to view contaminant
                    status, thresholds, and advisory context.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 text-right text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    {filteredSystems.length} systems
                  </Badge>
                  <p>Filter by type, status, or contaminant.</p>
                </div>
              </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
              <aside className="flex flex-col gap-6 rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Filters
                  </h3>

                  <LocationPicker className="w-full" value={location} onChange={setLocation} showClear />

                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">System Type</h4>
                    <ToggleGroup
                      type="single"
                      value={filters.systemType}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          systemType: (value as MapFilters["systemType"]) || "all",
                        }))
                      }
                      variant="outline"
                      className="grid grid-cols-1 gap-2"
                    >
                      <ToggleGroupItem value="all" className="text-xs font-medium">
                        All Systems
                      </ToggleGroupItem>
                      <ToggleGroupItem value="drinking" className="text-xs font-medium">
                        Drinking Water
                      </ToggleGroupItem>
                      <ToggleGroupItem value="recreational" className="text-xs font-medium">
                        Recreational
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">Status</h4>
                    <ToggleGroup
                      type="single"
                      value={filters.status}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          status: (value as MapFilters["status"]) || "all",
                        }))
                      }
                      variant="outline"
                      className="grid grid-cols-1 gap-2"
                    >
                      <ToggleGroupItem value="all" className="text-xs font-medium">
                        All Status
                      </ToggleGroupItem>
                      <ToggleGroupItem value="safe" className="text-xs font-medium">
                        Safe
                      </ToggleGroupItem>
                      <ToggleGroupItem value="warn" className="text-xs font-medium">
                        Monitor
                      </ToggleGroupItem>
                      <ToggleGroupItem value="alert" className="text-xs font-medium">
                        Advisory
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-muted-foreground">Contaminant</h4>
                    <ToggleGroup
                      type="single"
                      value={filters.contaminant}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          contaminant: (value as MapFilters["contaminant"]) || "all",
                        }))
                      }
                      variant="outline"
                      className="grid grid-cols-1 gap-2"
                    >
                      <ToggleGroupItem value="all" className="text-xs font-medium">
                        All Contaminants
                      </ToggleGroupItem>
                      {Object.values(Contaminant).map((contaminant) => (
                        <ToggleGroupItem key={contaminant} value={contaminant} className="text-xs font-medium">
                          {contaminant === Contaminant.ECOLI ? "E. coli" : contaminant}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>
                </div>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Legend
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setShowLegend((prev) => !prev)}>
                      <Layers className="mr-2 h-4 w-4" />
                      {showLegend ? "Hide" : "Show"}
                    </Button>
                  </CardHeader>
                  {showLegend && (
                    <CardContent className="space-y-3 text-xs">
                      <div className="space-y-2">
                        <span className="font-medium text-foreground/80">Status</span>
                        <div className="space-y-1">
                          <LegendItem color={STATUS_COLORS.safe} label="Safe" />
                          <LegendItem color={STATUS_COLORS.warn} label="Monitor" />
                          <LegendItem color={STATUS_COLORS.alert} label="Advisory" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <span className="font-medium text-foreground/80">Ring color</span>
                        <div className="space-y-1">
                          <LegendItem color="#3b82f6" label="Drinking water system" />
                          <LegendItem color="#8b5cf6" label="Recreational site" />
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              </aside>

              <main className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">Iowa Water Systems</h2>
                    <p className="text-sm text-muted-foreground">
                      {filteredSystems.length} systems in current view
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedSystem ? (
                      <Button variant="outline" size="sm" onClick={() => setSelectedSystemId(null)}>
                        <Info className="mr-2 h-4 w-4" />
                        Clear selection
                      </Button>
                    ) : null}
                  </div>
                </div>

                {seriesErrorMessage ? (
                  <Card className="border-amber-500/50 bg-amber-500/10">
                    <CardContent className="flex items-center gap-3 py-4 text-sm text-amber-900">
                      <Info className="h-5 w-5 flex-shrink-0" />
                      <span>
                        Unable to refresh some monitoring data. Cached values are shown. {seriesErrorMessage}
                      </span>
                    </CardContent>
                  </Card>
                ) : null}

                <Card className="overflow-hidden">
                  <CardContent className="p-0">
                    <WaterMap
                      systems={filteredSystems}
                      selectedSystem={selectedSystem}
                      onSelect={(system) => setSelectedSystemId(system?.id ?? null)}
                      center={mapCenter}
                      zoom={mapCenter ? 8 : undefined}
                      className="h-[520px] w-full"
                    />
                  </CardContent>
                </Card>

                {selectedSystem ? (
                  <Card>
                    <CardHeader>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-xl">
                            <MapPin className="h-4 w-4" />
                            {selectedSystem.name}
                          </CardTitle>
                          <CardDescription>
                            {selectedSystem.type === "drinking"
                              ? "Public drinking water system"
                              : "Recreational monitoring site"}
                          </CardDescription>
                        </div>
                        <Badge variant={STATUS_BADGE_VARIANTS[selectedSystem.status]}>
                          {selectedSystem.status === "warn"
                            ? "Monitor"
                            : selectedSystem.status === "alert"
                              ? "Advisory"
                              : selectedSystem.status === "safe"
                                ? "Safe"
                                : "Unknown"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
                        <div>
                          <span className="text-muted-foreground">Last updated</span>
                          <p className="font-medium">
                            {selectedSystem.metrics[0]?.latestDate
                              ? formatDate(selectedSystem.metrics[0]?.latestDate as string)
                              : "Not available"}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Coordinates</span>
                          <p className="font-mono text-xs">
                            {selectedSystem.location.lat.toFixed(4)}, {selectedSystem.location.lng.toFixed(4)}
                          </p>
                        </div>
                      </div>

                      {selectedSystem.metrics.length > 0 ? (
                        <div className="space-y-4">
                          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                            Monitored Contaminants
                          </h3>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {selectedSystem.metrics.map((metric) => (
                              <div
                                key={`${selectedSystem.id}-${metric.contaminant}`}
                                className="space-y-2 rounded-lg border border-border/50 bg-muted/40 p-3"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-medium text-foreground">{metric.label}</span>
                                  <Badge variant={STATUS_BADGE_VARIANTS[metric.status]}>
                                    {metric.status === "warn"
                                      ? "Monitor"
                                      : metric.status === "alert"
                                        ? "Advisory"
                                        : metric.status === "safe"
                                          ? "Safe"
                                          : "Unknown"}
                                  </Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm text-foreground">
                                  <span className="font-mono font-semibold">
                                    {metric.latestValue !== null && metric.latestValue !== undefined
                                      ? formatValue(metric.latestValue, metric.unit)
                                      : "No sample"}
                                  </span>
                                  {metric.thresholdValue ? (
                                    <span className="text-xs text-muted-foreground">
                                      Standard {metric.thresholdValue} {metric.thresholdUnit ?? metric.unit}
                                    </span>
                                  ) : null}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  {metric.latestDate ? (
                                    <span>Sampled {formatDate(metric.latestDate)}</span>
                                  ) : null}
                                  {metric.sourceUrl ? (
                                    <a
                                      href={metric.sourceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-medium text-primary underline-offset-2 hover:underline"
                                    >
                                      View source
                                    </a>
                                  ) : (
                                    <span>{metric.source}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                          No monitoring data available for this system yet. Check back once sampling begins.
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={() => setSelectedSystemId(null)}>
                          <Info className="mr-2 h-4 w-4" />
                          Close details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </main>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block h-3 w-3 rounded-full" style={{ background: color }} />
      <span>{label}</span>
    </div>
  )
}

function matchesReference(
  reference: WaterSystem["contaminants"][number],
  series: WaterSeriesResponse,
) {
  if (reference.systemId && series.systemId && reference.systemId !== series.systemId) {
    return false
  }
  if (reference.site) {
    const region = series.region?.toLowerCase() ?? ""
    if (!region.includes(reference.site.toLowerCase())) {
      return false
    }
  }
  return true
}

function getLatestPoint(series: WaterSeriesResponse) {
  const withValues = series.points
    .slice()
    .reverse()
    .find((point) => point.value !== null && point.value !== undefined)
  return withValues ?? null
}

function deriveSystemStatus(
  fallback: WaterSystem["status"],
  metrics: SystemMetric[],
): WaterSystem["status"] {
  if (metrics.some((metric) => metric.status === "alert")) return "alert"
  if (metrics.some((metric) => metric.status === "warn")) return "warn"
  if (metrics.some((metric) => metric.status === "safe")) return "safe"
  return fallback
}

function formatValue(value: number, unit: string) {
  if (value >= 100) return `${value.toFixed(0)} ${unit}`
  if (value >= 10) return `${value.toFixed(1)} ${unit}`
  if (value >= 1) return `${value.toFixed(2)} ${unit}`
  if (value > 0) return `${value.toFixed(3)} ${unit}`
  return `${value} ${unit}`
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
