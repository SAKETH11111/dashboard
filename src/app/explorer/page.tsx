"use client"

import { useMemo, useState, type CSSProperties } from "react"

import {
  Download,
  Search,
  Calendar,
  MapPin,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react"

import { WATER_SYSTEMS } from "@/data/water-systems"
import { AppSidebar } from "@/components/app-sidebar"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useWaterSeries } from "@/hooks/use-water-series"
import { WATER_THRESHOLDS } from "@/lib/water/thresholds"
import type { ContaminantValue, WaterSeriesResponse, WaterStatus, WaterSystem } from "@/types/water"
import { Contaminant } from "@/types/water"

type Filters = {
  contaminant: ContaminantValue | "All"
  systemType: "drinking" | "recreational" | "All"
  status: WaterStatus | "All"
  dateRange: "1y" | "5y" | "all"
}

type ExplorerRecord = {
  id: string
  seriesId: string
  seriesContaminant: ContaminantValue
  seriesTitle: string
  systemName: string
  systemType: "drinking" | "recreational"
  status: WaterStatus
  value: number
  formattedValue: string
  unit: string
  date: string
  location: string
  source: string
  sourceUrl?: string
  systemId?: string
  thresholdDisplay?: string
}

const contaminantOptions = [
  { label: "All Contaminants", value: "All" },
  { label: "Nitrate", value: Contaminant.NITRATE },
  { label: "Nitrite", value: Contaminant.NITRITE },
  { label: "E. coli", value: Contaminant.ECOLI },
  { label: "PFAS", value: Contaminant.PFAS },
  { label: "Arsenic", value: Contaminant.ARSENIC },
  { label: "DBP", value: Contaminant.DBP },
  { label: "Fluoride", value: Contaminant.FLUORIDE },
]

const systemTypeOptions = [
  { label: "All Systems", value: "All" },
  { label: "Drinking Water", value: "drinking" },
  { label: "Recreational", value: "recreational" },
]

const statusOptions = [
  { label: "All Status", value: "All" },
  { label: "Safe", value: "safe" },
  { label: "Monitor", value: "warn" },
  { label: "Advisory", value: "alert" },
  { label: "Unknown", value: "unknown" },
]

const statusConfig: Record<WaterStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> =
  {
    safe: { label: "Safe", variant: "default" },
    warn: { label: "Monitor", variant: "secondary" },
    alert: { label: "Advisory", variant: "destructive" },
    unknown: { label: "Unknown", variant: "outline" },
  }

const sidebarStyle = {
  "--header-height": "calc(var(--spacing) * 12)",
} as CSSProperties

export default function ExplorerPage() {
  const [filters, setFilters] = useState<Filters>({
    contaminant: "All",
    systemType: "All",
    status: "All",
    dateRange: "1y",
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedData, setSelectedData] = useState<string[]>([])
  const [isFiltersExpanded, setIsFiltersExpanded] = useState(true)

  const nitrateQuery = useWaterSeries(Contaminant.NITRATE)
  const nitriteQuery = useWaterSeries(Contaminant.NITRITE)
  const bacteriaQuery = useWaterSeries(Contaminant.ECOLI)
  const pfasQuery = useWaterSeries(Contaminant.PFAS)
  const arsenicQuery = useWaterSeries(Contaminant.ARSENIC)
  const dbpQuery = useWaterSeries(Contaminant.DBP)
  const fluorideQuery = useWaterSeries(Contaminant.FLUORIDE)

  const queryList = [
    nitrateQuery,
    nitriteQuery,
    bacteriaQuery,
    pfasQuery,
    arsenicQuery,
    dbpQuery,
    fluorideQuery,
  ]

  const isLoading = queryList.some((query) => query.isLoading)
  const seriesError = queryList.find((query) => query.error)?.error
  const seriesErrorMessage =
    seriesError instanceof Error ? seriesError.message : seriesError ? String(seriesError) : null

  const systemLookup = useMemo(() => buildSystemLookup(WATER_SYSTEMS), [])

  const records = useMemo<ExplorerRecord[]>(() => {
    const seriesList = [
      nitrateQuery.data,
      nitriteQuery.data,
      bacteriaQuery.data,
      pfasQuery.data,
      arsenicQuery.data,
      dbpQuery.data,
      fluorideQuery.data,
    ].filter((series): series is WaterSeriesResponse => Boolean(series))

    return seriesList.flatMap((series) => normalizeSeriesToRecords(series, systemLookup))
  }, [
    nitrateQuery.data,
    nitriteQuery.data,
    bacteriaQuery.data,
    pfasQuery.data,
    arsenicQuery.data,
    dbpQuery.data,
    fluorideQuery.data,
    systemLookup,
  ])

  const filteredData = useMemo(() => {
    const now = Date.now()
    const cutoff =
      filters.dateRange === "all"
        ? null
        : new Date(now - (filters.dateRange === "1y" ? 365 : 5 * 365) * 24 * 60 * 60 * 1000)

    const query = searchQuery.trim().toLowerCase()

    return records
      .filter((record) => {
        if (filters.contaminant !== "All" && record.seriesContaminant !== filters.contaminant) {
          return false
        }
        if (filters.systemType !== "All" && record.systemType !== filters.systemType) {
          return false
        }
        if (filters.status !== "All" && record.status !== filters.status) {
          return false
        }
        if (cutoff && new Date(record.date) < cutoff) {
          return false
        }
        if (query) {
          const haystack = `${record.systemName} ${record.location} ${record.seriesTitle}`.toLowerCase()
          if (!haystack.includes(query)) return false
        }
        return true
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [records, filters, searchQuery])

  const handleExportCSV = () => {
    const header = [
      "System",
      "System Type",
      "Contaminant",
      "Value",
      "Unit",
      "Status",
      "Sample Date",
      "Location",
      "Source",
      "Source URL",
      "System ID",
      "Threshold",
    ]
    const rows = filteredData.map((record) => [
      record.systemName,
      record.systemType,
      record.seriesContaminant,
      record.value,
      record.unit,
      record.status,
      new Date(record.date).toISOString(),
      record.location,
      record.source,
      record.sourceUrl ?? "",
      record.systemId ?? "",
      record.thresholdDisplay ?? "",
    ])
    const csvContent = [header, ...rows].map((row) => row.join(",")).join("\n")
    downloadCsv(csvContent, `iowa-water-data-${new Date().toISOString().split("T")[0]}.csv`)
  }

  const handleSelectData = (id: string) => {
    setSelectedData((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

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
                  <h1 className="text-3xl font-semibold tracking-tight">Water Data Explorer</h1>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Explore Iowa water quality data by contaminant, system type, and location. Filter, search,
                    and export data for analysis.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 text-right text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    {filteredData.length} records
                  </Badge>
                  <p>Filter by contaminant, system type, or status.</p>
                </div>
              </div>
            </header>

            <div
              className={`grid gap-6 transition-all ${
                isFiltersExpanded ? "lg:grid-cols-[320px_1fr]" : "lg:grid-cols-[60px_1fr]"
              }`}
            >
              <aside className="flex flex-col rounded-2xl border border-border/60 bg-card/70 backdrop-blur overflow-hidden">
                <button
                  onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                  className={`flex items-center gap-2 px-5 py-4 transition-colors hover:bg-muted/50 ${
                    !isFiltersExpanded && "justify-center"
                  }`}
                >
                  {isFiltersExpanded ? (
                    <>
                      <h3 className="text-sm font-semibold">Filters</h3>
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    </>
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>

                <div
                  className={`flex flex-col gap-4 px-5 pb-5 ${!isFiltersExpanded ? "hidden" : ""}`}
                >
                  <FilterBlock label="Search">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search systems..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </FilterBlock>

                  <FilterBlock label="Contaminant">
                    <Select
                      value={filters.contaminant}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          contaminant: value as ContaminantValue | "All",
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select contaminant" />
                      </SelectTrigger>
                      <SelectContent>
                        {contaminantOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FilterBlock>

                  <FilterBlock label="System Type">
                    <ToggleGroup
                      type="single"
                      value={filters.systemType}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          systemType: value as "drinking" | "recreational" | "All",
                        }))
                      }
                      variant="outline"
                      className="grid grid-cols-1 gap-2"
                    >
                      {systemTypeOptions.map((option) => (
                        <ToggleGroupItem key={option.value} value={option.value} className="text-xs font-medium">
                          {option.label}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </FilterBlock>

                  <FilterBlock label="Status">
                    <ToggleGroup
                      type="single"
                      value={filters.status}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          status: value as WaterStatus | "All",
                        }))
                      }
                      variant="outline"
                      className="grid grid-cols-1 gap-2"
                    >
                      {statusOptions.map((option) => (
                        <ToggleGroupItem key={option.value} value={option.value} className="text-xs font-medium">
                          {option.label}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </FilterBlock>

                  <FilterBlock label="Date Range">
                    <ToggleGroup
                      type="single"
                      value={filters.dateRange}
                      onValueChange={(value) =>
                        setFilters((prev) => ({
                          ...prev,
                          dateRange: value as Filters["dateRange"],
                        }))
                      }
                      variant="outline"
                      className="grid grid-cols-1 gap-2"
                    >
                      <ToggleGroupItem value="1y" className="text-xs font-medium">
                        1 Year
                      </ToggleGroupItem>
                      <ToggleGroupItem value="5y" className="text-xs font-medium">
                        5 Years
                      </ToggleGroupItem>
                      <ToggleGroupItem value="all" className="text-xs font-medium">
                        All Time
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </FilterBlock>

                  <div className="flex flex-col gap-2 pt-2">
                    <Button onClick={handleExportCSV} disabled={filteredData.length === 0} className="w-full">
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                    {selectedData.length > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => setSelectedData([])}
                        className="w-full"
                      >
                        Clear Selection ({selectedData.length})
                      </Button>
                    )}
                  </div>
                </div>
              </aside>

              <main className="flex flex-col space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Water Quality Data</h2>
                    <p className="text-sm text-muted-foreground">
                      {filteredData.length} records found
                      {isLoading ? " (loading latest samples…)" : ""}
                    </p>
                  </div>
                  {seriesErrorMessage ? (
                    <div className="flex items-center gap-2 rounded-md border border-amber-500/60 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-900">
                      <AlertTriangle className="h-4 w-4" />
                      {seriesErrorMessage}
                    </div>
                  ) : null}
                </div>

                {isLoading && filteredData.length === 0 ? (
                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Card key={index} className="border-border/60 bg-card/80 backdrop-blur">
                        <CardHeader className="pb-3">
                          <Skeleton className="h-5 w-1/2" />
                          <Skeleton className="h-4 w-3/4" />
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Skeleton className="h-6 w-24" />
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-full" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : filteredData.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3 [&>*:nth-child(4)]:md:col-span-2 [&>*:nth-child(4)]:xl:col-span-1">
                    {filteredData.map((record) => (
                      <WaterDataCard
                        key={record.id}
                        record={record}
                        selected={selectedData.includes(record.id)}
                        onSelect={() => handleSelectData(record.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/30 p-12 text-center text-sm text-muted-foreground">
                    <div>
                      <p className="font-medium">No data matches the current filters.</p>
                      <p className="mt-1 text-xs">Try adjusting your search or date range.</p>
                    </div>
                  </div>
                )}
              </main>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function FilterBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h3>
      {children}
    </section>
  )
}

function WaterDataCard({
  record,
  selected,
  onSelect,
}: {
  record: ExplorerRecord
  selected: boolean
  onSelect: () => void
}) {
  const status = statusConfig[record.status] ?? statusConfig.unknown

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 ${selected ? "ring-2 ring-primary" : ""}`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onSelect()
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1.5">
            <CardTitle className="line-clamp-2 text-base leading-tight">{record.systemName}</CardTitle>
            <CardDescription className="flex items-center gap-1.5 text-xs">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{record.location}</span>
            </CardDescription>
          </div>
          <Badge variant={status.variant} className="flex-shrink-0 text-xs">
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="min-w-[140px] flex-1">
            <Label className="mb-1 block text-xs text-muted-foreground">Contaminant</Label>
            <p className="text-sm font-semibold capitalize">{record.seriesContaminant}</p>
          </div>
          <div className="min-w-[140px] flex-1">
            <Label className="mb-1 block text-xs text-muted-foreground">Value</Label>
            <p className="text-sm font-semibold">
              {record.formattedValue}{" "}
              <span className="font-normal text-muted-foreground">{record.unit}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">{new Date(record.date).toLocaleDateString()}</span>
          </div>
          <Badge variant="outline" className="whitespace-nowrap text-xs capitalize">
            {record.systemType}
          </Badge>
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          <div>
            <span className="font-medium text-foreground/80">Source:</span> {record.source}
          </div>
          {record.thresholdDisplay ? (
            <div>
              <span className="font-medium text-foreground/80">Standard:</span> {record.thresholdDisplay}
            </div>
          ) : null}
          {record.sourceUrl ? (
            <a
              href={record.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              View source
            </a>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function buildSystemLookup(systems: WaterSystem[]) {
  const map = new Map<string, WaterSystem>()
  systems.forEach((system) => {
    map.set(system.id.toLowerCase(), system)
    if (system.systemId) {
      map.set(system.systemId.toLowerCase(), system)
    }
    map.set(system.name.toLowerCase(), system)
  })
  return map
}

function normalizeSeriesToRecords(series: WaterSeriesResponse, systemLookup: Map<string, WaterSystem>) {
  const system =
    (series.systemId ? systemLookup.get(series.systemId.toLowerCase()) : null) ??
    (series.region ? systemLookup.get(series.region.toLowerCase()) : null) ??
    null

  const inferredSystemType =
    system?.type ?? (series.regionType === "site" || series.contaminant === "ecoli" ? "recreational" : "drinking")

  const threshold = series.threshold ?? WATER_THRESHOLDS[series.contaminant]
  const thresholdValue = threshold?.alertLevel ?? threshold?.healthAdvisory ?? threshold?.mcl ?? null
  const thresholdDisplay = thresholdValue != null ? `${thresholdValue} ${threshold.unit}` : undefined

  return series.points
    .filter((point) => point.value !== null && point.value !== undefined)
    .map((point) => {
      const formattedValue = formatValue(point.value as number, series.unit)
      return {
        id: `${series.contaminant}-${series.systemId ?? series.region}-${point.date}`,
        seriesId: `${series.contaminant}-${series.systemId ?? series.region}`,
        seriesContaminant: series.contaminant,
        seriesTitle: series.metric,
        systemName: system?.name ?? series.region,
        systemType: inferredSystemType,
        status: point.status ?? series.status,
        value: point.value as number,
        formattedValue,
        unit: series.unit,
        date: point.date,
        location: series.region,
        source: series.source,
        sourceUrl: series.sourceUrl,
        systemId: series.systemId ?? system?.systemId,
        thresholdDisplay,
      } satisfies ExplorerRecord
    })
}

function formatValue(value: number, unit: string) {
  if (value >= 100) return `${value.toFixed(0)} ${unit}`
  if (value >= 10) return `${value.toFixed(1)} ${unit}`
  if (value >= 1) return `${value.toFixed(2)} ${unit}`
  if (value > 0) return `${value.toFixed(3)} ${unit}`
  return `${value} ${unit}`
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv" })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}
