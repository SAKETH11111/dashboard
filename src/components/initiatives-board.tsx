"use client"

import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import { ExternalLink, Search, SlidersHorizontal, ThumbsUp } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { TagFilter } from "@/components/news/tag-filter"
import type { Initiative } from "@/types/initiatives"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type ColumnKey = "status" | "votes" | "notes" | "updated"
type MetricFilterValue = "all" | "temp" | "co2" | "sea-ice" | "resilience" | "finance"
type StatusFilter = Initiative["status"] | typeof DEFAULT_STATUS

const COLUMN_OPTIONS: { key: ColumnKey; label: string }[] = [
  { key: "status", label: "Status" },
  { key: "votes", label: "Votes" },
  { key: "notes", label: "Notes" },
  { key: "updated", label: "Last updated" },
]

const METRIC_FILTERS: { label: string; value: MetricFilterValue }[] = [
  { label: "All metrics", value: "all" },
  { label: "Temperature", value: "temp" },
  { label: "Carbon", value: "co2" },
  { label: "Cryosphere", value: "sea-ice" },
  { label: "Resilience", value: "resilience" },
  { label: "Climate finance", value: "finance" },
]

const SORT_OPTIONS = [
  { label: "Most popular", value: "votes" },
  { label: "Recently updated", value: "updated" },
]

const DEFAULT_TAG = "All focus areas"
const DEFAULT_BRANCH = "all"
const DEFAULT_STATUS = "all"

const statusStyles: Record<Initiative["status"], string> = {
  Active: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "In Progress": "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  Planned: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  Completed: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
}

const METRIC_LABELS = METRIC_FILTERS.map((option) => option.label)

type InteractionState = Record<
  string,
  {
    upvoted?: boolean
    notes?: {
      id: string
      text: string
      createdAt: string
    }[]
  }
>

const createId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

export function InitiativesBoard() {
  const [interactions, setInteractions] = useLocalStorage<InteractionState>(
    "initiative-interactions-v1",
    {}
  )

  const [search, setSearch] = useState("")
  const [branch, setBranch] = useState<string>(DEFAULT_BRANCH)
  const [status, setStatus] = useState<StatusFilter>(DEFAULT_STATUS)
  const [selectedTag, setSelectedTag] = useState<string>(DEFAULT_TAG)
  const [selectedMetric, setSelectedMetric] = useState<MetricFilterValue>("all")
  const [sort, setSort] = useState("votes")
  const [panelId, setPanelId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState("")
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    () => new Set(COLUMN_OPTIONS.map((option) => option.key))
  )

  const initiativesQuery = useQuery<{
    initiatives: Initiative[]
    updatedAt: string | null
  }>({
    queryKey: ["initiatives-board"],
    queryFn: async () => {
      const response = await fetch("/api/initiatives", { cache: "no-store" })
      if (!response.ok) {
        throw new Error(`Failed to load initiatives (${response.status})`)
      }
      return response.json()
    },
    staleTime: 1000 * 60 * 30,
  })

  const initiativesData = initiativesQuery.data?.initiatives
  const dataset = useMemo(() => initiativesData ?? [], [initiativesData])
  const datasetUpdatedAt = initiativesQuery.data?.updatedAt ?? null
  const isLoading = initiativesQuery.isLoading
  const isError = initiativesQuery.isError
  const queryError = initiativesQuery.error

  const branches = useMemo(
    () => Array.from(new Set(dataset.map((item) => item.branch))).sort(),
    [dataset]
  )
  const statuses = useMemo(() => {
    const unique = new Set<Initiative["status"]>(dataset.map((item) => item.status))
    return Array.from(unique).sort()
  }, [dataset])
  const focusFilters = useMemo(() => {
    const tags = Array.from(new Set(dataset.flatMap((item) => item.tags))).sort((a, b) =>
      a.localeCompare(b)
    )
    return [DEFAULT_TAG, ...tags]
  }, [dataset])

  const focusTagCounts = useMemo(() => {
    const counts: Record<string, number> = { [DEFAULT_TAG]: dataset.length }
    dataset.forEach((item) => {
      item.tags.forEach((tag) => {
        counts[tag] = (counts[tag] ?? 0) + 1
      })
    })
    return counts
  }, [dataset])

  const selectedMetricLabel = useMemo(
    () => METRIC_FILTERS.find((option) => option.value === selectedMetric)?.label ?? METRIC_FILTERS[0].label,
    [selectedMetric]
  )

  useEffect(() => {
    if (branch !== DEFAULT_BRANCH && branches.length && !branches.includes(branch)) {
      setBranch(DEFAULT_BRANCH)
    }
  }, [branch, branches])

  useEffect(() => {
    if (status !== DEFAULT_STATUS && statuses.length && !statuses.includes(status)) {
      setStatus(DEFAULT_STATUS)
    }
  }, [status, statuses])

  useEffect(() => {
    if (selectedTag !== DEFAULT_TAG && focusFilters.length && !focusFilters.includes(selectedTag)) {
      setSelectedTag(DEFAULT_TAG)
    }
  }, [selectedTag, focusFilters])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return dataset
      .filter((item) => {
        if (branch !== DEFAULT_BRANCH && item.branch !== branch) return false
        if (status !== DEFAULT_STATUS && item.status !== status) return false
        if (selectedTag !== DEFAULT_TAG && !item.tags.includes(selectedTag)) return false
        if (selectedMetric !== "all" && !item.metrics.includes(selectedMetric)) return false
        if (query.length) {
          const haystack = `${item.title} ${item.summary} ${item.tags.join(" ")} ${item.branch}`.toLowerCase()
          if (!haystack.includes(query)) return false
        }
        return true
      })
      .map((item) => {
        const interaction = interactions[item.id]
        const adjustedVotes = item.votes + (interaction?.upvoted ? 1 : 0)
        const noteCount = interaction?.notes?.length ?? 0
        return {
          ...item,
          adjustedVotes,
          noteCount,
        }
      })
      .sort((a, b) => {
        if (sort === "votes") {
          return b.adjustedVotes - a.adjustedVotes
        }
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      })
  }, [dataset, branch, status, selectedTag, selectedMetric, search, sort, interactions])

  const activeInitiative = panelId ? dataset.find((item) => item.id === panelId) ?? null : null
  const activeInteraction = panelId ? interactions[panelId] : undefined

  const toggleVote = (id: string) => {
    setInteractions((prev) => {
      const current = prev[id]?.upvoted ?? false
      return {
        ...prev,
        [id]: {
          ...prev[id],
          upvoted: !current,
        },
      }
    })
  }

  const addNote = (id: string) => {
    if (!noteDraft.trim()) return
    setInteractions((prev) => {
      const entry = prev[id]
      const newNote = {
        id: createId(),
        text: noteDraft.trim(),
        createdAt: new Date().toISOString(),
      }
      return {
        ...prev,
        [id]: {
          ...entry,
          notes: entry?.notes ? [newNote, ...entry.notes] : [newNote],
        },
      }
    })
    setNoteDraft("")
  }

  const clearFilters = () => {
    setBranch(DEFAULT_BRANCH)
    setStatus(DEFAULT_STATUS)
    setSelectedTag(DEFAULT_TAG)
    setSelectedMetric("all")
    setSearch("")
    setSort("votes")
  }

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size === 1) {
          return prev
        }
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const handlePanelOpen = (id: string) => {
    setPanelId(id)
    setNoteDraft("")
  }

  const handlePanelClose = () => {
    setPanelId(null)
    setNoteDraft("")
  }

  const handleMetricSelect = (label: string) => {
    const match = METRIC_FILTERS.find((option) => option.label === label)
    setSelectedMetric(match?.value ?? "all")
  }

  return (
    <>
      <div className="flex flex-col gap-6 px-4 lg:px-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-border/80 bg-card/95 p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
            <div className="relative flex-1 min-w-[220px] md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search initiatives or keywords"
                className="h-9 w-full pl-9"
              />
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-2 md:flex-none">
              <Select value={branch} onValueChange={setBranch}>
                <SelectTrigger className="h-9 w-40">
                  <SelectValue placeholder="All branches" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DEFAULT_BRANCH}>All branches</SelectItem>
                  {branches.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
                <SelectTrigger className="h-9 w-40">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={DEFAULT_STATUS}>All statuses</SelectItem>
                  {statuses.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-9 w-40">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="ml-0 flex items-center gap-2 md:ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 gap-2 px-2">
                    <SlidersHorizontal className="size-3.5" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {COLUMN_OPTIONS.map((option) => (
                    <DropdownMenuCheckboxItem
                      key={option.key}
                      checked={visibleColumns.has(option.key)}
                      onCheckedChange={() => toggleColumn(option.key)}
                    >
                      {option.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="sm" className="h-8 px-2" onClick={clearFilters}>
                Reset
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-border/60 pt-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Focus areas
              </p>
              <TagFilter
                tags={focusFilters}
                selectedTag={selectedTag}
                onSelect={setSelectedTag}
                tagCounts={focusTagCounts}
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Linked metrics
              </p>
              <TagFilter
                tags={METRIC_LABELS}
                selectedTag={selectedMetricLabel}
                onSelect={handleMetricSelect}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-border/80 bg-card/95 p-6 shadow-sm">
          <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-lg font-semibold leading-tight">Flagship UN Climate Initiatives</h2>
              <p className="text-sm text-muted-foreground">
                Live feed curated from UNEP, UNDP, UNFCCC, and GCF programmes. Track status and momentum in one glance.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Votes and notes are stored locally for quick prioritisation.
            </p>
          </div>
          <div className="hidden w-full overflow-x-auto md:block">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-16 w-full rounded-md" />
                ))}
              </div>
            ) : isError ? (
              <div className="text-sm text-muted-foreground">
                {queryError instanceof Error ? queryError.message : "Failed to load initiatives."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Initiative</TableHead>
                    {visibleColumns.has("status") && <TableHead>Status</TableHead>}
                    {visibleColumns.has("votes") && <TableHead>Votes</TableHead>}
                    {visibleColumns.has("notes") && <TableHead>Notes</TableHead>}
                    {visibleColumns.has("updated") && <TableHead>Last updated</TableHead>}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length ? (
                    filtered.map((item, index) => {
                      const interaction = interactions[item.id]
                      const upvoted = interaction?.upvoted ?? false
                      const votes = item.adjustedVotes
                      const noteCount = item.noteCount

                      return (
                        <motion.tr
                          key={item.id}
                          custom={index}
                          initial="hidden"
                          animate="visible"
                          variants={{
                            hidden: { opacity: 0, y: 12 },
                            visible: {
                              opacity: 1,
                              y: 0,
                              transition: { delay: index * 0.04, duration: 0.25, ease: "easeOut" },
                            },
                          }}
                          className="border-b border-border/60 transition-colors hover:bg-muted/40"
                        >
                          <TableCell className="align-top">
                            <div className="flex flex-col gap-1.5 py-2">
                              <span className="text-sm font-semibold text-foreground">
                                {item.title}
                              </span>
                              <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                <span>Branch</span>
                                <Badge variant="outline" className="text-[0.65rem] uppercase tracking-wide">
                                  {item.branch}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground md:text-sm line-clamp-2">
                                {item.summary}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                <span>Focus</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {item.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-[0.65rem] normal-case">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                <span>Metrics</span>
                                <div className="flex flex-wrap gap-1.5">
                                  {item.metrics.map((metric) => (
                                    <Badge key={metric} variant="secondary" className="text-[0.65rem] normal-case">
                                      {metricLabel(metric)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          {visibleColumns.has("status") && (
                            <TableCell className="align-top whitespace-nowrap">
                              <span className={cn("rounded-full px-2 py-1 text-xs font-medium", statusStyles[item.status])}>
                                {item.status}
                              </span>
                            </TableCell>
                          )}
                          {visibleColumns.has("votes") && (
                            <TableCell className="align-top">
                              <div className="flex items-center gap-3 py-2">
                                <span className="text-sm font-semibold text-foreground">
                                  {votes.toLocaleString()}
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon-sm"
                                  className={cn(
                                    "transition-colors [&_svg]:size-3.5",
                                    upvoted
                                      ? "border-transparent bg-accent text-black hover:bg-accent hover:text-black"
                                      : "border-border hover:border-accent hover:text-accent"
                                  )}
                                  onClick={() => toggleVote(item.id)}
                                  aria-label={upvoted ? "Remove vote" : "Upvote initiative"}
                                >
                                  <ThumbsUp />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                          {visibleColumns.has("notes") && (
                            <TableCell className="align-top whitespace-nowrap">
                              <div className="flex flex-col gap-1 py-2 text-sm text-muted-foreground">
                                <span>{item.comments.toLocaleString()} public</span>
                                <span>{noteCount.toLocaleString()} saved</span>
                              </div>
                            </TableCell>
                          )}
                          {visibleColumns.has("updated") && (
                            <TableCell className="align-top text-sm text-muted-foreground whitespace-nowrap">
                              {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                                new Date(item.lastUpdated)
                              )}
                            </TableCell>
                          )}
                          <TableCell className="align-top">
                            <div className="flex justify-end py-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3"
                                onClick={() => handlePanelOpen(item.id)}
                              >
                                View details
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      )
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={visibleColumns.size + 2} className="h-28 text-center text-sm text-muted-foreground">
                        No initiatives match the current filters. Adjust filters to explore more programmes.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
          <div className="space-y-4 md:hidden">
            {isLoading ? (
              <>
                {Array.from({ length: 3 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-40 w-full rounded-md" />
                ))}
              </>
            ) : isError ? (
              <Card className="border-dashed border-border">
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  {queryError instanceof Error ? queryError.message : "Failed to load initiatives."}
                </CardContent>
              </Card>
            ) : filtered.length ? (
              filtered.map((item, index) => {
                const interaction = interactions[item.id]
                const upvoted = interaction?.upvoted ?? false
                const votes = item.adjustedVotes
                const noteCount = item.noteCount

                return (
                  <motion.div
                    key={item.id}
                    custom={index}
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      visible: {
                        opacity: 1,
                        y: 0,
                        transition: { delay: index * 0.04, duration: 0.25, ease: "easeOut" },
                      },
                    }}
                  >
                    <Card className="border-border">
                      <CardHeader className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-2">
                            <div className="flex flex-col gap-1">
                              <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                                Branch
                              </span>
                              <Badge variant="outline" className="w-fit text-[0.7rem] uppercase tracking-wide">
                                {item.branch}
                              </Badge>
                            </div>
                            <CardTitle className="text-base leading-tight">
                              {item.title}
                            </CardTitle>
                          </div>
                          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusStyles[item.status])}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.summary}</p>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-1">
                          <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                            Focus Areas
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {item.tags.map((tag) => (
                              <Badge key={tag} variant="outline" className="text-[0.7rem] normal-case">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                            Metrics
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {item.metrics.map((metric) => (
                              <Badge key={metric} variant="secondary" className="text-[0.7rem] normal-case">
                                {metricLabel(metric)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">
                              {votes.toLocaleString()}
                            </span>
                            <button
                              type="button"
                              className={cn(
                                "inline-flex h-8 w-8 items-center justify-center rounded-full border transition-colors [&_svg]:size-3",
                                upvoted
                                  ? "border-transparent bg-accent text-black hover:bg-accent hover:text-black"
                                  : "border-border hover:border-accent hover:text-accent"
                              )}
                              onClick={() => toggleVote(item.id)}
                              aria-label={upvoted ? "Remove vote" : "Upvote initiative"}
                            >
                              <ThumbsUp />
                            </button>
                            <span className="uppercase tracking-wide">votes</span>
                          </div>
                          <span>
                            {(item.comments + noteCount).toLocaleString()} notes · Updated{" "}
                            {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(item.lastUpdated))}
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-end">
                        <Button size="sm" variant="outline" onClick={() => handlePanelOpen(item.id)}>
                          View details
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                )
              })
            ) : (
              <Card className="border-dashed border-border">
                <CardContent className="p-8 text-center text-sm text-muted-foreground">
                  No initiatives match the current filters. Adjust filters to explore more programmes.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      <div className="px-4 pb-4 text-xs text-muted-foreground lg:px-6">
        Dataset curated from official UN agency communiqués and public climate finance releases. Backend is ready to swap in a live UN initiatives API when access becomes available.{" "}
        {datasetUpdatedAt
          ? `Last sync ${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(datasetUpdatedAt))}.`
          : "Last sync Oct 2025."}
      </div>

      <Sheet open={Boolean(activeInitiative)} onOpenChange={(open) => (open ? null : handlePanelClose())}>
        <SheetContent
          side="right"
          className="h-full w-full max-w-[540px] overflow-y-auto px-6 py-6 sm:max-w-xl"
        >
          {activeInitiative ? (
            <>
              <SheetHeader className="items-start gap-2 p-0 text-left">
                <SheetTitle className="text-xl font-semibold leading-tight">
                  {activeInitiative.title}
                </SheetTitle>
                <SheetDescription className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span className="uppercase tracking-wide text-muted-foreground">Branch</span>
                    <Badge variant="outline">{activeInitiative.branch}</Badge>
                  </span>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", statusStyles[activeInitiative.status])}>
                    {activeInitiative.status}
                  </span>
                  <span>
                    Updated{" "}
                    {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                      new Date(activeInitiative.lastUpdated)
                    )}
                  </span>
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-5">
                <p className="text-sm text-muted-foreground">{activeInitiative.summary}</p>
                <div className="space-y-2 text-sm">
                  <h3 className="text-sm font-semibold text-foreground">Full description</h3>
                  <p className="leading-relaxed text-muted-foreground whitespace-pre-line">
                    {activeInitiative.description}
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <h3 className="text-sm font-semibold text-foreground">Focus areas</h3>
                  <div className="flex flex-wrap gap-2">
                    {activeInitiative.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <h3 className="text-sm font-semibold text-foreground">Linked metrics</h3>
                  <div className="flex flex-wrap gap-2">
                    {activeInitiative.metrics.map((metric) => (
                      <Badge key={metric} variant="secondary">
                        {metricLabel(metric)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    asChild
                    variant="secondary"
                    className="gap-2"
                  >
                    <a href={activeInitiative.link} target="_blank" rel="noopener noreferrer">
                      Open programme site
                      <ExternalLink className="size-3" />
                    </a>
                  </Button>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <span className="text-sm font-semibold text-foreground">Source note</span>
                  <p className="leading-relaxed">
                    Entry curated from official UN agency communiqués and climate finance press releases.
                    Last verified{" "}
                    {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                      new Date(activeInitiative.lastUpdated)
                    )}
                    .
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Add a local note</h3>
                  <textarea
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    placeholder="Capture next steps, stakeholders, or follow-up ideas (stored locally)."
                    className="min-h-[90px] w-full rounded border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Notes are stored in your browser only.</span>
                    <Button
                      size="sm"
                      onClick={() => activeInitiative && addNote(activeInitiative.id)}
                    >
                      Save note
                    </Button>
                  </div>
                  {activeInteraction?.notes?.length ? (
                    <div className="space-y-2 text-sm">
                      <h4 className="text-sm font-semibold text-foreground">Your saved notes</h4>
                      <ul className="space-y-2">
                        {activeInteraction.notes.map((note) => (
                          <li
                            key={note.id}
                            className="rounded border border-border bg-card/60 p-3 text-sm text-muted-foreground"
                          >
                            <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                              {new Intl.DateTimeFormat("en", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              }).format(new Date(note.createdAt))}
                            </div>
                            {note.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
              <SheetFooter className="p-0 pt-4">
                <Button variant="outline" onClick={handlePanelClose}>
                  Close
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  )
}

function metricLabel(metric: Initiative["metrics"][number]) {
  switch (metric) {
    case "temp":
      return "Temperature"
    case "co2":
      return "CO₂"
    case "sea-ice":
      return "Cryosphere"
    case "resilience":
      return "Resilience"
    case "finance":
      return "Climate finance"
    default:
      return metric
  }
}
