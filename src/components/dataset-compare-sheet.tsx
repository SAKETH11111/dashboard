"use client"

import { useEffect, useMemo, useState } from "react"
import type { DateRange } from "react-day-picker"

import type { DatasetDefinition } from "@/data/datasets"
import {
  getSmoothingLabel,
  MetricPanel,
  metrics as climateMetricConfigs,
  RangeSelector,
  type MetricConfig,
  type RangeKey,
} from "@/components/metric-detail-sheet"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Toggle } from "@/components/ui/toggle"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"

type CompareSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  datasets: DatasetDefinition[]
  onRemove: (datasetId: string) => void
}

export function DatasetCompareSheet({ open, onOpenChange, datasets, onRemove }: CompareSheetProps) {
  const supportedConfigs = useMemo(() => {
    const orderedConfigs: MetricConfig[] = []
    const seen = new Set<MetricConfig["key"]>()
    datasets.forEach((dataset) => {
      if (!dataset.metricKey) return
      if (seen.has(dataset.metricKey as MetricConfig["key"])) return
      const config = climateMetricConfigs.find((item) => item.key === dataset.metricKey)
      if (config) {
        orderedConfigs.push(config)
        seen.add(config.key)
      }
    })
    return orderedConfigs
  }, [datasets])

  const [selectedMetric, setSelectedMetric] = useState<MetricConfig["key"]>(
    supportedConfigs[0]?.key ?? "co2"
  )
  const [range, setRange] = useState<RangeKey>("5y")
  const [customRange, setCustomRange] = useState<DateRange>({ from: undefined, to: undefined })
  const [smooth, setSmooth] = useState(false)

  useEffect(() => {
    if (supportedConfigs.length && !supportedConfigs.some((config) => config.key === selectedMetric)) {
      setSelectedMetric(supportedConfigs[0].key)
    }
  }, [supportedConfigs, selectedMetric])

  useEffect(() => {
    if (range !== "custom" && (customRange.from || customRange.to)) {
      setCustomRange({ from: undefined, to: undefined })
    }
  }, [range, customRange.from, customRange.to])


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="overflow-hidden px-0"
        resizable
        defaultWidth={880}
        minWidth={600}
        maxWidth={1180}
        storageKey="dataset-compare-width"
      >
        <SheetHeader className="px-6">
          <SheetTitle>Compare datasets</SheetTitle>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {datasets.map((dataset) => (
                  <Badge key={dataset.id} variant="secondary" className="flex items-center gap-2 text-xs">
                    {dataset.title}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-4"
                      onClick={() => onRemove(dataset.id)}
                      aria-label={`Remove ${dataset.title}`}
                    >
                      ×
                    </Button>
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Select a monitor to view the full analysis. We’ll mirror the dashboard detail panel for a consistent experience.
              </p>
            </div>
            <RangeSelector
              value={range}
              onChange={setRange}
              customRange={customRange}
              onCustomRangeChange={(next) => setCustomRange(next ?? { from: undefined, to: undefined })}
            />
          </div>
          <Separator />

          {supportedConfigs.length ? (
            <Tabs value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as MetricConfig["key"])}>
              <TabsList className="w-full justify-start gap-2 overflow-x-auto">
                {supportedConfigs.map((config) => (
                  <TabsTrigger
                    key={config.key}
                    value={config.key}
                    className="whitespace-nowrap rounded-md border border-border/60 px-3 py-1 text-sm transition-colors hover:bg-accent hover:text-accent-foreground data-[state=active]:border-transparent data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-sm"
                  >
                    {config.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              {supportedConfigs.map((config) => {
                const datasetForConfig = datasets.find((dataset) => dataset.metricKey === config.key) ?? null
                const smoothingLabelForConfig = getSmoothingLabel(config)
                return (
                  <TabsContent key={config.key} value={config.key} className="mt-4 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-medium leading-tight">
                          {datasetForConfig?.title ?? config.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Source: {datasetForConfig?.provider ?? "United Nations Climate Data"} • Unit: {config.unit}
                        </p>
                      </div>
                      {config.smoothingWindow ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Toggle
                              pressed={smooth}
                              onPressedChange={setSmooth}
                              aria-label="Toggle smoothing"
                              variant="outline"
                              className="text-sm font-medium"
                            >
                              {smoothingLabelForConfig}
                            </Toggle>
                          </TooltipTrigger>
                          <TooltipContent side="top">Toggle rolling average line</TooltipContent>
                        </Tooltip>
                      ) : null}
                    </div>

                    <MetricPanel config={config} range={range} customRange={customRange} smooth={smooth} />
                  </TabsContent>
                )
              })}
            </Tabs>
          ) : (
            <div className="flex h-48 items-center justify-center rounded border border-dashed border-border text-sm text-muted-foreground">
              Select a dataset with an analysis panel (CO₂, Temperature, Sea Ice, Sea Level, Methane, ENSO, Ocean Heat, Renewables Share, Forest Area, or Deforestation Alerts) to view the analysis panel.
            </div>
          )}
        </div>
        <SheetFooter className="flex flex-col items-start gap-2 px-6 pb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => datasets.forEach((dataset) => onRemove(dataset.id))}
            className="border-border transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Clear selection
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
