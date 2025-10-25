"use client"

import type { CSSProperties } from "react"
import { useMemo, useState } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { DatasetCard } from "@/components/dataset-card"
import { DatasetCompareSheet } from "@/components/dataset-compare-sheet"
import { SiteHeader } from "@/components/site-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Textarea } from "@/components/ui/textarea"
import { climateDatasets, type DatasetDefinition, type DatasetDomain, type DatasetFrequency } from "@/data/datasets"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useUserPreferences } from "@/hooks/use-user-preferences"
import { cn } from "@/lib/utils"

type Filters = {
  frequency: DatasetFrequency | "All"
  domain: DatasetDomain | "All"
  provider: string | "All"
}

const monitorCategories = new Set(["monitor"])
const annualCategories = new Set(["annual"])
const indexCategories = new Set(["index"])
const createListId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `list-${Date.now()}`

export default function ExplorerPage() {
  const { preferences, setPreferences } = useUserPreferences()
  const [filters, setFilters] = useState<Filters>({
    frequency: "All",
    domain: "All",
    provider: "All",
  })
  const [selected, setSelected] = useState<DatasetDefinition[]>([])
  const [compareOpen, setCompareOpen] = useState(false)
  const [notesMap, setNotesMap] = useLocalStorage<Record<string, string>>("climate-dataset-notes", {})
  const [notesState, setNotesState] = useState<{ open: boolean; dataset: DatasetDefinition | null; draft: string }>({
    open: false,
    dataset: null,
    draft: "",
  })

  const lists = preferences.lists ?? []
  const activeList =
    lists.find((list) => list.id === preferences.activeListId) ?? lists[0] ?? null

  const frequencyOptions = useMemo<Array<{ label: string; value: DatasetFrequency | "All" }>>(
    () => [
      { label: "All", value: "All" },
      { label: "Daily", value: "Daily" },
      { label: "Monthly", value: "Monthly" },
      { label: "Annual", value: "Annual" },
    ],
    []
  )

  const domainOptions = useMemo<Array<{ label: string; value: DatasetDomain | "All" }>>(() => {
    const domains = Array.from(new Set(climateDatasets.map((dataset) => dataset.domain))).sort((a, b) =>
      a.localeCompare(b)
    )
    return [{ label: "All domains", value: "All" }, ...domains.map((value) => ({ label: value, value }))]
  }, [])

  const providerOptions = useMemo(() => {
    const providers = Array.from(new Set(climateDatasets.map((dataset) => dataset.provider))).sort((a, b) =>
      a.localeCompare(b)
    )
    return providers
  }, [])

  const filteredDatasets = useMemo(() => {
    return climateDatasets.filter((dataset) => {
      if (filters.frequency !== "All" && dataset.frequency !== filters.frequency) return false
      if (filters.domain !== "All" && dataset.domain !== filters.domain) return false
      if (filters.provider !== "All" && dataset.provider !== filters.provider) return false
      return true
    })
  }, [filters])

  const activePinnedIdSet = useMemo(
    () => new Set(activeList?.datasetIds ?? []),
    [activeList]
  )

  const pinnedDatasets = useMemo(
    () => filteredDatasets.filter((dataset) => activePinnedIdSet.has(dataset.id)),
    [filteredDatasets, activePinnedIdSet]
  )

  const monitorDatasets = useMemo(
    () =>
      filteredDatasets.filter(
        (dataset) => monitorCategories.has(dataset.category) && !activePinnedIdSet.has(dataset.id)
      ),
    [filteredDatasets, activePinnedIdSet]
  )

  const annualDatasets = useMemo(
    () =>
      filteredDatasets.filter(
        (dataset) => annualCategories.has(dataset.category) && !activePinnedIdSet.has(dataset.id)
      ),
    [filteredDatasets, activePinnedIdSet]
  )

  const indexDatasets = useMemo(
    () =>
      filteredDatasets.filter(
        (dataset) => indexCategories.has(dataset.category) && !activePinnedIdSet.has(dataset.id)
      ),
    [filteredDatasets, activePinnedIdSet]
  )

  const handleCompareToggle = (dataset: DatasetDefinition) => {
    if (selected.find((item) => item.id === dataset.id)) {
      setSelected((prev) => prev.filter((item) => item.id !== dataset.id))
      return
    }
    setSelected((prev) => [...prev, dataset])
    setCompareOpen(true)
  }

  const handleRemoveDataset = (id: string) => {
    setSelected((prev) => prev.filter((item) => item.id !== id))
  }

  const togglePin = (dataset: DatasetDefinition) => {
    setPreferences((current) => {
      if (!current.lists.length) {
        const fallbackId = createListId()
        return {
          ...current,
          lists: [{ id: fallbackId, name: "My Saved Datasets", datasetIds: [dataset.id] }],
          activeListId: fallbackId,
        }
      }

      const activeId =
        current.activeListId && current.lists.some((list) => list.id === current.activeListId)
          ? current.activeListId
          : current.lists[0].id

      const nextLists = current.lists.map((list) => {
        if (list.id !== activeId) return list
        const exists = list.datasetIds.includes(dataset.id)
        return {
          ...list,
          datasetIds: exists
            ? list.datasetIds.filter((id) => id !== dataset.id)
            : [...list.datasetIds, dataset.id],
        }
      })

      return {
        ...current,
        lists: nextLists,
        activeListId: activeId,
      }
    })
  }

  const openNotes = (dataset: DatasetDefinition) => {
    setNotesState({
      open: true,
      dataset,
      draft: notesMap[dataset.id] ?? "",
    })
  }

  const handleSaveNote = () => {
    if (!notesState.dataset) return
    setNotesMap((prev) => ({
      ...prev,
      [notesState.dataset!.id]: notesState.draft.trim(),
    }))
    setNotesState((prev) => ({ ...prev, open: false }))
  }

  const handleDeleteNote = () => {
    if (!notesState.dataset) return
    setNotesMap((prev) => {
      const next = { ...prev }
      delete next[notesState.dataset!.id]
      return next
    })
    setNotesState((prev) => ({ ...prev, open: false }))
  }

  const sidebarStyle = {
    "--header-height": "calc(var(--spacing) * 12)",
  } as CSSProperties

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
                  <h1 className="text-3xl font-semibold tracking-tight">Climate Data Catalog</h1>
                  <p className="max-w-2xl text-sm text-muted-foreground">
                    Explore authoritative climate indicators curated from NOAA, NASA, NSIDC, FAO, and partner UN
                    agencies. Pin datasets, take notes, and build comparisons before sending weekly briefings.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 text-right text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    {filteredDatasets.length} datasets
                  </Badge>
                  <p>Filter by cadence, domain, or provider to narrow the catalog.</p>
                </div>
              </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
              <aside className="flex flex-col gap-6 rounded-2xl border border-border/60 bg-card/70 p-4 backdrop-blur">
                <FilterBlock label="Cadence">
                  <ToggleGroup
                    type="single"
                    value={filters.frequency}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        frequency: (value as DatasetFrequency | "All") || "All",
                      }))
                    }
                    variant="outline"
                    className="grid grid-cols-2 gap-2"
                  >
                    {frequencyOptions.map((option) => (
                      <ToggleGroupItem key={option.value} value={option.value} className="text-xs font-medium">
                        {option.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </FilterBlock>

                <FilterBlock label="Domain">
                  <ToggleGroup
                    type="single"
                    value={filters.domain}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        domain: (value as DatasetDomain | "All") || "All",
                      }))
                    }
                    variant="outline"
                    className="grid grid-cols-2 gap-2"
                  >
                    {domainOptions.map((option) => (
                      <ToggleGroupItem key={option.value} value={option.value} className="text-xs font-medium">
                        {option.label}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                </FilterBlock>

                <FilterBlock label="Provider">
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant={filters.provider === "All" ? "secondary" : "outline"}
                      size="sm"
                      className="justify-start text-xs"
                      onClick={() => setFilters((prev) => ({ ...prev, provider: "All" }))}
                    >
                      All providers
                    </Button>
                    {providerOptions.map((name) => (
                      <Button
                        key={name}
                        variant={filters.provider === name ? "secondary" : "outline"}
                        size="sm"
                        className="justify-start text-xs"
                        onClick={() => setFilters((prev) => ({ ...prev, provider: name }))}
                      >
                        {name}
                      </Button>
                    ))}
                  </div>
                </FilterBlock>

                <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Download policy</p>
                  <p className="mt-1">
                    Use the “View source” link on each dataset card to reach the official CSV/API maintained by the
                    provider.
                  </p>
                </div>
              </aside>

              <main className="space-y-8">
                {pinnedDatasets.length ? (
                  <>
                    <SectionHeader
                      title="Pinned datasets"
                      description={
                        activeList
                          ? `Your "${activeList.name}" list across monitors, annual reports, and indices.`
                          : "Your quick access list across monitors, annual reports, and indices."
                      }
                      action={
                        <Badge variant="secondary" className="text-xs">
                          {pinnedDatasets.length} pinned
                        </Badge>
                      }
                    />
                    <DatasetGrid
                      datasets={pinnedDatasets}
                      selected={selected}
                      onCompare={handleCompareToggle}
                      pinnedSet={activePinnedIdSet}
                      onTogglePin={togglePin}
                      onOpenNotes={openNotes}
                      notesMap={notesMap}
                    />
                  </>
                ) : null}

                <SectionHeader
                  title="Live monitors"
                  description="Daily and monthly indicators you can compare instantly."
                  action={
                    <Button
                      variant={selected.length ? "default" : "outline"}
                      size="sm"
                      disabled={!selected.length}
                      onClick={() => setCompareOpen(true)}
                    >
                      Compare ({selected.length})
                    </Button>
                  }
                />
                {monitorDatasets.length ? (
                  <DatasetGrid
                    datasets={monitorDatasets}
                    selected={selected}
                    onCompare={handleCompareToggle}
                    pinnedSet={activePinnedIdSet}
                    onTogglePin={togglePin}
                    onOpenNotes={openNotes}
                    notesMap={notesMap}
                  />
                ) : (
                  <EmptyState message="No monitor datasets match the current filters." />
                )}

                {annualDatasets.length ? (
                  <>
                    <SectionHeader
                      title="Annual & thematic series"
                      description="Slower moving metrics for land use, energy systems, and finance."
                    />
                    <DatasetGrid
                      datasets={annualDatasets}
                      selected={selected}
                      onCompare={handleCompareToggle}
                      pinnedSet={activePinnedIdSet}
                      onTogglePin={togglePin}
                      onOpenNotes={openNotes}
                      notesMap={notesMap}
                    />
                  </>
                ) : null}

                {indexDatasets.length ? (
                  <>
                    <SectionHeader
                      title="Climate indices"
                      description="Drivers like ENSO and ocean heat content to contextualize the monitors."
                    />
                    <DatasetGrid
                      datasets={indexDatasets}
                      selected={selected}
                      onCompare={handleCompareToggle}
                      pinnedSet={activePinnedIdSet}
                      onTogglePin={togglePin}
                      onOpenNotes={openNotes}
                      notesMap={notesMap}
                    />
                  </>
                ) : null}
              </main>
            </div>
          </div>
        </div>
      </SidebarInset>
      <DatasetCompareSheet
        open={compareOpen}
        onOpenChange={setCompareOpen}
        datasets={selected}
        onRemove={handleRemoveDataset}
      />
      <DatasetNotesSheet
        open={notesState.open}
        dataset={notesState.dataset}
        value={notesState.draft}
        onChange={(draft) => setNotesState((prev) => ({ ...prev, draft }))}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
        onClose={() => setNotesState((prev) => ({ ...prev, open: false }))}
      />
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

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

function DatasetGrid({
  datasets,
  selected,
  onCompare,
  pinnedSet,
  onTogglePin,
  onOpenNotes,
  notesMap,
}: {
  datasets: DatasetDefinition[]
  selected: DatasetDefinition[]
  onCompare: (dataset: DatasetDefinition) => void
  pinnedSet: Set<string>
  onTogglePin: (dataset: DatasetDefinition) => void
  onOpenNotes: (dataset: DatasetDefinition) => void
  notesMap: Record<string, string>
}) {
  if (!datasets.length) return null
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {datasets.map((dataset) => {
        const isSelected = selected.some((item) => item.id === dataset.id)
        return (
          <DatasetCard
            key={dataset.id}
            dataset={dataset}
            onCompare={onCompare}
            selected={isSelected}
            pinned={pinnedSet.has(dataset.id)}
            onTogglePin={onTogglePin}
            onOpenNotes={onOpenNotes}
            hasNotes={Boolean(notesMap[dataset.id]?.trim())}
          />
        )
      })}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  )
}

function DatasetNotesSheet({
  open,
  dataset,
  value,
  onChange,
  onSave,
  onDelete,
  onClose,
}: {
  open: boolean
  dataset: DatasetDefinition | null
  value: string
  onChange: (value: string) => void
  onSave: () => void
  onDelete: () => void
  onClose: () => void
}) {
  const canDelete = Boolean(value.trim())
  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Notes for {dataset?.title ?? ""}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-3 py-4">
          <Textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Capture context, data caveats, or planned follow-up for this dataset. Notes stay on this device."
            className="min-h-[220px]"
          />
        </div>
        <SheetFooter className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            className={cn("text-destructive", !canDelete && "opacity-50")}
            onClick={onDelete}
            disabled={!canDelete}
          >
            Clear note
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" onClick={onSave} disabled={!dataset}>
              Save note
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
