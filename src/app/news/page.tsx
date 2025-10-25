"use client"

import type { CSSProperties } from "react"
import { useEffect, useMemo, useState } from "react"

import { useQuery } from "@tanstack/react-query"
import { Loader2, RefreshCw, Search } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import { FlickeringGrid } from "@/components/magicui/flickering-grid"
import { NewsCard } from "@/components/news/news-card"
import { TagFilter } from "@/components/news/tag-filter"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import type { NewsItem } from "@/types/content"

const HERO_TITLE = "Climate News Briefings"
const HERO_COPY = "Fresh intelligence from UN agencies, scientific partners, and climate monitoring networks."
const DEFAULT_FILTER = "All"
const EMPTY_ITEMS: NewsItem[] = []
const PAGE_SIZE = 12
const DATE_FILTERS = [
  { label: "Past 30 days", value: "30" },
  { label: "Past 90 days", value: "90" },
  { label: "Past year", value: "365" },
  { label: "All time", value: "all" },
]

async function fetchNews(): Promise<{ items: NewsItem[]; updatedAt: string }> {
  const res = await fetch("/api/news")
  const payload = await res.json()
  if (!res.ok) {
    throw new Error(payload?.error ?? "Failed to load news feed")
  }
  return payload
}

export default function NewsPage() {
  const [selectedTag, setSelectedTag] = useState(DEFAULT_FILTER)
  const [selectedSource, setSelectedSource] = useState(DEFAULT_FILTER)
  const [search, setSearch] = useState("")
  const [dateRange, setDateRange] = useState<string>(DATE_FILTERS[1].value)
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["news-feed"],
    queryFn: fetchNews,
    staleTime: 1000 * 60 * 30,
  })

  const items = data?.items ?? EMPTY_ITEMS
  const updatedAt = data?.updatedAt

  const tags = useMemo(() => {
    const set = new Set<string>()
    items.forEach((item) => item.categories.forEach((category) => set.add(category)))
    return [DEFAULT_FILTER, ...Array.from(set).sort()]
  }, [items])

  useEffect(() => {
    if (selectedTag !== DEFAULT_FILTER && !tags.includes(selectedTag)) {
      setSelectedTag(DEFAULT_FILTER)
    }
  }, [tags, selectedTag])

  const sources = useMemo(() => {
    const set = new Set<string>(items.map((item) => item.source))
    return [DEFAULT_FILTER, ...Array.from(set).sort()]
  }, [items])

  useEffect(() => {
    if (selectedSource !== DEFAULT_FILTER && !sources.includes(selectedSource)) {
      setSelectedSource(DEFAULT_FILTER)
    }
  }, [sources, selectedSource])

  const tagCounts = useMemo(() => {
    return tags.reduce((acc, tag) => {
      if (tag === DEFAULT_FILTER) {
        acc[tag] = items.length
      } else {
        acc[tag] = items.filter((item) => item.categories.includes(tag)).length
      }
      return acc
    }, {} as Record<string, number>)
  }, [items, tags])

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    const cutoff = dateRange === "all" ? null : Date.now() - Number(dateRange) * 24 * 60 * 60 * 1000
    return items.filter((item) => {
      const matchesSource = selectedSource === DEFAULT_FILTER || item.source === selectedSource
      const matchesTag = selectedTag === DEFAULT_FILTER || item.categories.includes(selectedTag)
      const matchesSearch =
        query.length === 0 ||
        item.title.toLowerCase().includes(query) ||
        item.summary.toLowerCase().includes(query)
      const matchesDate =
        cutoff === null || new Date(item.publishedAt).getTime() >= cutoff
      return matchesSource && matchesTag && matchesSearch && matchesDate
    })
  }, [items, selectedSource, selectedTag, search, dateRange])

  useEffect(() => {
    setPage(1)
  }, [selectedTag, selectedSource, search, dateRange, data?.updatedAt])

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
    if (page > maxPage) {
      setPage(maxPage)
    }
  }, [filteredItems.length, page])

  const totalItems = filteredItems.length
  const pageCount = Math.max(1, Math.ceil(totalItems / PAGE_SIZE))
  const displayedItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredItems.slice(start, start + PAGE_SIZE)
  }, [filteredItems, page])

  const startIndex = totalItems ? (page - 1) * PAGE_SIZE + 1 : 0
  const endIndex = totalItems ? Math.min(page * PAGE_SIZE, totalItems) : 0

  const sidebarStyle = {
    "--header-height": "calc(var(--spacing) * 12)",
  } as CSSProperties

  return (
    <SidebarProvider style={sidebarStyle}>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="relative flex flex-1 flex-col">
          <div className="absolute left-0 top-0 w-full">
            <FlickeringGrid className="h-[220px] w-full [mask-image:linear-gradient(to_top,transparent_25%,black_95%)]" />
          </div>

          <div className="relative flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
            <header className="flex flex-col gap-6 border-b border-border/70 bg-background/70 pb-6">
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-2">
                    <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                      {HERO_TITLE}
                    </h1>
                    <p className="max-w-3xl text-sm text-muted-foreground md:text-base">
                      {HERO_COPY}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 border border-border"
                    onClick={() => refetch()}
                    disabled={isFetching}
                  >
                    {isFetching ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                    Refresh feed
                  </Button>
                </div>
                {updatedAt ? (
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Updated {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(updatedAt))}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[220px] md:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search headlines or keywords"
                      className="h-9 w-full pl-9"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={selectedSource} onValueChange={setSelectedSource}>
                      <SelectTrigger className="h-9 w-40">
                        <SelectValue placeholder="All sources" />
                      </SelectTrigger>
                      <SelectContent>
                        {sources.map((item) => (
                          <SelectItem key={item} value={item}>
                            {item}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger className="h-9 w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DATE_FILTERS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <TagFilter
                  tags={tags}
                  selectedTag={selectedTag}
                  onSelect={setSelectedTag}
                  tagCounts={tagCounts}
                />
              </div>
            </header>

            <section className="w-full">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-0 border-x border-b border-border bg-card/40 sm:grid-cols-2 lg:grid-cols-3 sm:[&>a:nth-child(2n)]:border-r-0 lg:[&>a:nth-child(3n)]:border-r-0">
                  {Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                    <div key={idx} className="flex min-h-[220px] flex-col border-b border-border p-6">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="mt-4 h-6 w-3/4" />
                      <Skeleton className="mt-3 h-4 w-full" />
                      <Skeleton className="mt-2 h-4 w-5/6" />
                      <div className="mt-auto flex gap-2 pt-6">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : isError ? (
                <div className="flex flex-col items-center justify-center gap-3 border border-border bg-card/70 px-6 py-16 text-center text-sm text-muted-foreground">
                  <p>{error instanceof Error ? error.message : "Failed to load news."}</p>
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    Try again
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-0 border-x border-b border-border bg-card/40 sm:grid-cols-2 lg:grid-cols-3 sm:[&>a:nth-child(2n)]:border-r-0 lg:[&>a:nth-child(3n)]:border-r-0">
                  {displayedItems.map((item) => (
                    <NewsCard
                      key={item.id}
                      title={item.title}
                      summary={item.summary}
                      link={item.link}
                      source={item.source}
                      publishedAt={item.publishedAt}
                      categories={item.categories}
                    />
                  ))}
                  {!displayedItems.length && (
                    <div className="flex flex-col items-center justify-center gap-2 border-b border-border bg-card/70 px-6 py-16 text-sm text-muted-foreground md:col-span-2 lg:col-span-3">
                      <p>No stories match the current filters yet.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTag(DEFAULT_FILTER)
                          setSelectedSource(DEFAULT_FILTER)
                          setSearch("")
                        }}
                      >
                        Reset filters
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </section>

            {!isLoading && !isError && (
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>
                  {totalItems
                    ? `Showing ${startIndex}-${endIndex} of ${totalItems} articles`
                    : "Showing 0 of 0 articles"}
                </span>
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page <= 1}
                  >
                    ← Previous
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {Math.min(page, pageCount)} of {pageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => setPage((prev) => Math.min(pageCount, prev + 1))}
                    disabled={page >= pageCount}
                  >
                    Next →
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
