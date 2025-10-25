"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Download, ExternalLink, NotebookPen, Star } from "lucide-react"

import type { DatasetDefinition } from "@/data/datasets"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type DatasetCardProps = {
  dataset: DatasetDefinition
  onCompare: (dataset: DatasetDefinition) => void
  disabled?: boolean
  selected?: boolean
  pinned?: boolean
  onTogglePin?: (dataset: DatasetDefinition) => void
  onOpenNotes?: (dataset: DatasetDefinition) => void
  hasNotes?: boolean
}

const frequencyColor: Record<DatasetDefinition["frequency"], string> = {
  Daily: "text-emerald-600 dark:text-emerald-300",
  Monthly: "text-sky-600 dark:text-sky-300",
  Annual: "text-amber-600 dark:text-amber-300",
}

const domainColor: Record<DatasetDefinition["domain"], string> = {
  Atmosphere: "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200",
  Cryosphere: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200",
  Ocean: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-200",
  Energy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200",
  Land: "bg-lime-100 text-lime-700 dark:bg-lime-500/10 dark:text-lime-200",
}

export function DatasetCard({
  dataset,
  onCompare,
  disabled,
  selected,
  pinned,
  onTogglePin,
  onOpenNotes,
  hasNotes,
}: DatasetCardProps) {
  const compareDisabled = disabled || dataset.status === "coming-soon" || !dataset.metricKey
  const categoryLabel =
    dataset.category === "monitor"
      ? "Monitor"
      : dataset.category === "annual"
        ? "Annual dataset"
        : dataset.category === "index"
          ? "Climate index"
          : undefined

  const updatedAt = useMemo(() => {
    if (dataset.lastUpdatedHint) return dataset.lastUpdatedHint
    return dataset.status === "coming-soon" ? "Integration planned" : "Refresh for latest value"
  }, [dataset.lastUpdatedHint, dataset.status])

  return (
    <Card
      key={dataset.id}
      className="flex h-full flex-col border-border/70 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70"
    >
      <CardHeader className="space-y-3 pb-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={domainColor[dataset.domain]}>
                {dataset.domain}
              </Badge>
              <span className={`font-medium ${frequencyColor[dataset.frequency]}`}>
                {dataset.frequency}
              </span>
              {categoryLabel ? (
                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                  {categoryLabel}
                </Badge>
              ) : null}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "size-8 text-muted-foreground transition-colors hover:text-foreground",
              pinned && "text-amber-500 hover:text-amber-400"
            )}
            onClick={() => onTogglePin?.(dataset)}
            aria-label={pinned ? "Unpin dataset" : "Pin dataset"}
          >
            <Star className={cn("size-4", pinned && "fill-current")} />
          </Button>
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold leading-tight text-foreground">
            {dataset.title}
          </h3>
          <p className="text-sm text-muted-foreground">{dataset.description}</p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-3 pb-0 pt-4">
        <div className="space-y-2 text-xs text-muted-foreground">
          <InfoRow label="Provider" value={dataset.provider} />
          <InfoRow label="Unit" value={dataset.unit} />
          <InfoRow label="Update cadence" value={dataset.frequency} />
          <InfoRow label="Last updated" value={updatedAt} />
          {dataset.status === "coming-soon" && (
            <p className="text-amber-600 dark:text-amber-300">
              Coming soon – integration scheduled next.
            </p>
          )}
          {dataset.notes && <p>{dataset.notes}</p>}
          {hasNotes && (
            <p className="text-emerald-600 dark:text-emerald-300">
              Personal notes saved for this dataset.
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-3 pt-4">
        <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild className="size-8">
                  <Link href={dataset.endpoint} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
            <TooltipContent side="top">View source</TooltipContent>
          </Tooltip>
          {dataset.downloadUrl ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild className="size-8">
                  <a href={dataset.downloadUrl} target="_blank" rel="noreferrer" download>
                    <Download className="size-4" />
                  </a>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Download CSV</TooltipContent>
            </Tooltip>
          ) : null}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("size-8", hasNotes && "text-emerald-600 dark:text-emerald-300")}
                onClick={() => onOpenNotes?.(dataset)}
              >
                <NotebookPen className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              {hasNotes ? "Edit notes" : "Add notes"}
            </TooltipContent>
          </Tooltip>
        </div>
        <Button
          variant={selected ? "default" : "outline"}
          size="sm"
          disabled={compareDisabled}
          onClick={() => onCompare(dataset)}
          className="text-xs"
        >
          {selected ? "Added" : "Add to compare"}
        </Button>
      </CardFooter>
    </Card>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="font-medium text-foreground">{label}</span>: {value}
    </p>
  )
}
