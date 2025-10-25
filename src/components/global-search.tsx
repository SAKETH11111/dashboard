"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  FileText,
  Home,
  LineChart,
  Newspaper,
  Search,
  Settings,
  TrendingUp,
} from "lucide-react"

import { initiatives } from "@/data/initiatives"
import { climateSections } from "@/lib/search-index"
import { newsEntries } from "@/lib/news-index"

import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

type SearchItem = {
  title: string
  description?: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  keywords?: string
  category: string
}

const navigationItems: SearchItem[] = [
  {
    title: "Home",
    href: "/dashboard",
    icon: Home,
    keywords: "dashboard overview documents",
    category: "Navigation",
  },
  {
    title: "Data Explorer",
    href: "/explorer",
    icon: LineChart,
    keywords: "charts metrics data",
    category: "Navigation",
  },
  {
    title: "News",
    href: "/news",
    icon: Newspaper,
    keywords: "updates feed articles",
    category: "Navigation",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    keywords: "profile preferences",
    category: "Navigation",
  },
]

function buildSearchIndex(): SearchItem[] {
  const climateItems: SearchItem[] = climateSections.map((section) => ({
    title: section.title,
    description: section.description,
    href: section.href,
    icon: TrendingUp,
    keywords: `${section.title} ${section.tags?.join(" ") ?? ""}`,
    category: "Climate metrics",
  }))

  const initiativeItems: SearchItem[] = initiatives.map((item) => ({
    title: item.title,
    description: item.summary,
    href: `/initiatives#${item.id}`,
    icon: FileText,
    keywords: `${item.branch} ${item.tags.join(" ")}`,
    category: "Initiatives",
  }))

  const newsItems: SearchItem[] = newsEntries.map((item) => ({
    title: item.title,
    description: item.description,
    href: item.href,
    icon: Newspaper,
    keywords: item.tags?.join(" ") ?? "news",
    category: "News",
  }))

  return [...navigationItems, ...climateItems, ...initiativeItems, ...newsItems]
}

const searchIndex = buildSearchIndex()

export function GlobalSearch() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  const [query, setQuery] = React.useState("")

  const filteredItems = React.useMemo(() => {
    if (!query.trim()) return searchIndex
    const lower = query.toLowerCase()
    return searchIndex.filter((item) => {
      const haystack = `${item.title} ${item.description ?? ""} ${item.keywords ?? ""}`.toLowerCase()
      return haystack.includes(lower)
    })
  }, [query])

  const groupedItems = React.useMemo(() => {
    return filteredItems.reduce<Record<string, SearchItem[]>>((groups, item) => {
      const key = item.category
      if (!groups[key]) groups[key] = []
      groups[key].push(item)
      return groups
    }, {})
  }, [filteredItems])

  const runCommand = React.useCallback(
    (href: string) => {
      setOpen(false)
      if (href.startsWith("http")) {
        window.open(href, "_blank", "noopener,noreferrer")
      } else {
        router.push(href)
      }
    },
    [router]
  )

  const handleOpenChange = React.useCallback((nextState: boolean) => {
    if (!nextState) {
      setQuery("")
    }
    setOpen(nextState)
  }, [])

  const handleSelect = React.useCallback((value: string) => {
    const item = searchIndex.find((entry) => entry.title === value)
    if (item) {
      runCommand(item.href)
    }
  }, [runCommand])

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className="hidden h-9 w-56 items-center justify-start gap-2 text-sm text-muted-foreground md:flex"
          onClick={() => setOpen(true)}
        >
          <Search className="size-4" />
          <span className="flex-1 truncate text-left">Search</span>
          <kbd className="pointer-events-none hidden rounded border border-border bg-muted px-1.5 text-[11px] font-medium text-muted-foreground/80 lg:flex">
            ⌘K
          </kbd>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9 items-center justify-center text-muted-foreground md:hidden"
          onClick={() => setOpen(true)}
        >
          <Search className="size-4" />
          <span className="sr-only">Open search</span>
        </Button>
      </div>

      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <CommandInput
          placeholder="Search metrics, initiatives, news..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {Object.entries(groupedItems).map(([category, items]) => (
            <CommandGroup key={category} heading={category}>
              {items.map((item) => (
                <CommandItem
                  key={`${category}-${item.title}`}
                  value={item.title}
                  onSelect={handleSelect}
                >
                  <item.icon className="size-4 text-sidebar-foreground/70" />
                  <div className="flex flex-1 flex-col justify-center">
                    <span className="text-sm font-medium text-sidebar-foreground">
                      {item.title}
                    </span>
                    {item.description && (
                      <span className="text-xs text-sidebar-foreground/60">
                        {item.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}
