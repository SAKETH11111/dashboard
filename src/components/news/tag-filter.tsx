"use client"

import { useMemo } from "react"
import { ChevronDown } from "lucide-react"

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"

interface TagFilterProps {
  tags: string[]
  selectedTag: string
  onSelect: (tag: string) => void
  tagCounts?: Record<string, number>
}

export function TagFilter({ tags, selectedTag, onSelect, tagCounts }: TagFilterProps) {
  const counts = useMemo(() => {
    if (!tagCounts) return undefined
    return tags.reduce((acc, tag) => {
      acc[tag] = tagCounts[tag] ?? 0
      return acc
    }, {} as Record<string, number>)
  }, [tagCounts, tags])

  return (
    <>
      <div className="hidden flex-wrap gap-2 md:flex">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => onSelect(tag)}
            className={cn(
              "flex h-8 items-center gap-2 rounded-lg border border-border px-3 text-sm transition-colors",
              selectedTag === tag
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            <span>{tag}</span>
            {counts?.[tag] ? (
              <span
                className={cn(
                  "flex h-6 min-w-6 items-center justify-center rounded-md border px-1 text-xs",
                  selectedTag === tag
                    ? "border-border/40 bg-background text-primary"
                    : "border-border text-muted-foreground"
                )}
              >
                {counts[tag]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <Drawer>
        <DrawerTrigger className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted md:hidden">
          <span className="capitalize">{selectedTag}</span>
          <ChevronDown className="size-4" />
        </DrawerTrigger>
        <DrawerContent className="md:hidden">
          <DrawerHeader>
            <h3 className="text-sm font-semibold">Select category</h3>
          </DrawerHeader>
          <div className="space-y-2 p-4">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => onSelect(tag)}
                className="flex w-full items-center justify-between text-sm transition-colors"
              >
                <span
                  className={cn(
                    "text-left",
                    selectedTag === tag ? "text-primary underline underline-offset-4" : "text-muted-foreground"
                  )}
                >
                  {tag}
                </span>
                {counts?.[tag] ? (
                  <span className="flex h-6 min-w-6 items-center justify-center rounded-md border border-border text-xs">
                    {counts[tag]}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
