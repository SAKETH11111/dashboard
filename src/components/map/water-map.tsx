"use client"

import "maplibre-gl/dist/maplibre-gl.css"

import { useEffect, useMemo, useRef } from "react"
import maplibregl, { Map as MapLibreMap, Marker, Popup } from "maplibre-gl"

import type { WaterStatus, WaterSystem } from "@/types/water"

const STATUS_COLORS: Record<WaterStatus, string> = {
  safe: "#10b981",
  warn: "#f59e0b",
  alert: "#ef4444",
  unknown: "#6b7280",
}

const TYPE_COLORS: Record<WaterSystem["type"], string> = {
  drinking: "#3b82f6",
  recreational: "#8b5cf6",
}

type SystemMetricSummary = {
  contaminant: string
  label: string
  status: WaterStatus
  latestValue: number | null
  latestDate: string | null
  unit: string
  thresholdValue?: number | null
  thresholdUnit?: string
  source?: string
  sourceUrl?: string
}

type MarkerEntry = {
  marker: Marker
  element: HTMLDivElement
  popup: Popup
}

type WaterMapProps = {
  systems: Array<
    WaterSystem & {
      metrics?: Array<SystemMetricSummary>
    }
  >
  selectedSystem?: (WaterSystem & { metrics?: Array<SystemMetricSummary> }) | null
  onSelect?: (system: (WaterSystem & { metrics?: Array<SystemMetricSummary> }) | null) => void
  center?: [number, number]
  zoom?: number
  className?: string
}

const DEFAULT_CENTER: [number, number] = [-93.0977, 41.878] // Iowa
const DEFAULT_ZOOM = 6.5

export function WaterMap({
  systems,
  selectedSystem,
  onSelect,
  center,
  zoom,
  className = "h-[480px] w-full rounded-2xl border border-border/60",
}: WaterMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<Map<string, MarkerEntry>>(new Map())

  const effectiveCenter = useMemo(() => center ?? DEFAULT_CENTER, [center])
  const effectiveZoom = zoom ?? DEFAULT_ZOOM

  // Initialise the map once
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: effectiveCenter,
      zoom: effectiveZoom,
    })

    map.addControl(new maplibregl.NavigationControl({ showZoom: true }))

    mapRef.current = map
    const markerStore = markersRef.current

    return () => {
      markerStore.forEach(({ marker, popup }) => {
        popup.remove()
        marker.remove()
      })
      markerStore.clear()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update center when preference changes
  useEffect(() => {
    if (!mapRef.current) return
    mapRef.current.easeTo({ center: effectiveCenter, zoom: effectiveZoom, duration: 500 })
  }, [effectiveCenter, effectiveZoom])

  const buildPopupContent = (system: WaterMapProps["systems"][number]) => {
    const container = document.createElement("div")
    container.className =
      "space-y-2 rounded-lg border border-border/60 bg-background/95 p-3 text-xs shadow-lg backdrop-blur"

    const title = document.createElement("h3")
    title.className = "text-sm font-semibold text-foreground"
    title.textContent = system.name
    container.appendChild(title)

    const subtitle = document.createElement("p")
    subtitle.className = "text-[11px] uppercase tracking-wide text-muted-foreground"
    subtitle.textContent = system.type === "drinking" ? "Drinking Water System" : "Recreational Site"
    container.appendChild(subtitle)

    if (system.metrics && system.metrics.length > 0) {
      const metricList = document.createElement("div")
      metricList.className = "space-y-2"

      system.metrics.forEach((metric) => {
        const item = document.createElement("div")
        item.className = "space-y-1 rounded-md border border-border/50 bg-card/80 p-2"

        const header = document.createElement("div")
        header.className = "flex items-center justify-between gap-2"

        const label = document.createElement("span")
        label.className = "text-xs font-medium text-foreground"
        label.textContent = metric.label
        header.appendChild(label)

        const statusBadge = document.createElement("span")
        statusBadge.className =
          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
        statusBadge.style.background = STATUS_COLORS[metric.status] ?? "#6b7280"
        statusBadge.style.color = "#ffffff"
        statusBadge.textContent =
          metric.status === "warn" ? "Monitor" : metric.status === "alert" ? "Advisory" : "Safe"
        header.appendChild(statusBadge)
        item.appendChild(header)

        const valueRow = document.createElement("div")
        valueRow.className = "flex items-center justify-between text-xs text-foreground"

        const valueText = document.createElement("span")
        valueText.className = "font-mono font-medium"
        valueText.textContent =
          metric.latestValue !== null && metric.latestValue !== undefined
            ? formatValue(metric.latestValue, metric.unit)
            : "No recent sample"
        valueRow.appendChild(valueText)

        if (metric.thresholdValue) {
          const thresholdText = document.createElement("span")
          thresholdText.className = "text-[11px] text-muted-foreground"
          thresholdText.textContent = `Std ${metric.thresholdValue} ${metric.thresholdUnit ?? metric.unit}`
          valueRow.appendChild(thresholdText)
        }

        item.appendChild(valueRow)

        if (metric.latestDate || metric.source || metric.sourceUrl) {
          const detailRow = document.createElement("div")
          detailRow.className = "flex items-center justify-between text-[11px] text-muted-foreground"

          if (metric.latestDate) {
            const dateText = document.createElement("span")
            dateText.textContent = `Sampled ${formatDate(metric.latestDate)}`
            detailRow.appendChild(dateText)
          }

          if (metric.sourceUrl) {
            const link = document.createElement("a")
            link.href = metric.sourceUrl
            link.target = "_blank"
            link.rel = "noopener noreferrer"
            link.className = "text-xs font-medium text-primary underline-offset-2 hover:underline"
            link.textContent = "Source"
            detailRow.appendChild(link)
          } else if (metric.source) {
            const sourceText = document.createElement("span")
            sourceText.textContent = metric.source
            detailRow.appendChild(sourceText)
          }

          item.appendChild(detailRow)
        }

        metricList.appendChild(item)
      })

      container.appendChild(metricList)
    } else {
      const empty = document.createElement("p")
      empty.className = "text-[11px] text-muted-foreground"
      empty.textContent = "No monitoring data available for this site."
      container.appendChild(empty)
    }

    return container
  }

  // Update markers when systems list changes
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    const markers = markersRef.current
    const ids = new Set(systems.map((system) => system.id))

    // Remove markers for systems no longer present
    markers.forEach((entry, key) => {
      if (!ids.has(key)) {
        entry.popup.remove()
        entry.marker.remove()
        markers.delete(key)
      }
    })

    // Add or update markers for current systems
    systems.forEach((system) => {
      if (!system.location) return

      let entry = markers.get(system.id)
      if (!entry) {
        const el = document.createElement("div")
        el.className = "water-map-marker"
        el.style.width = "18px"
        el.style.height = "18px"
        el.style.borderRadius = "9999px"
        el.style.cursor = "pointer"
        el.style.border = `3px solid ${TYPE_COLORS[system.type]}`
        el.style.background = STATUS_COLORS[system.status]
        el.style.boxShadow = "0 0 4px rgba(0,0,0,0.4)"

        const popup = new maplibregl.Popup({
          closeButton: false,
          offset: 18,
          className: "water-map-popup",
        }).setDOMContent(buildPopupContent(system))

        el.addEventListener("click", (event) => {
          event.stopPropagation()
          onSelect?.(system)
          popup.addTo(map)
        })

        el.addEventListener("mouseenter", () => {
          popup.addTo(map)
        })

        el.addEventListener("mouseleave", () => {
          if (!selectedSystem || selectedSystem.id !== system.id) {
            popup.remove()
          }
        })

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([system.location.lng, system.location.lat])
          .setPopup(popup)
          .addTo(map)

        entry = { marker, element: el, popup }
        markers.set(system.id, entry)
      } else {
        entry.marker.setLngLat([system.location.lng, system.location.lat])
        entry.element.style.background = STATUS_COLORS[system.status]
        entry.element.style.borderColor = TYPE_COLORS[system.type]
        entry.popup.setDOMContent(buildPopupContent(system))
      }
    })

    // Highlight selected marker
    markers.forEach(({ element }, key) => {
      const isSelected = selectedSystem && key === selectedSystem.id
      element.style.transform = isSelected ? "scale(1.2)" : "scale(1)"
      element.style.zIndex = isSelected ? "10" : "1"
    })
  }, [systems, selectedSystem, onSelect])

  // Keep popup of selected system open
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((entry, key) => {
      if (selectedSystem && key === selectedSystem.id) {
        entry.popup.addTo(map)
      } else {
        entry.popup.remove()
      }
    })
  }, [selectedSystem])

  return <div ref={containerRef} className={className} />
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
