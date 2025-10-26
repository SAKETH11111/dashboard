"use client"

import "maplibre-gl/dist/maplibre-gl.css"

import { useEffect, useRef } from "react"
import type { Map as MapLibreMap } from "maplibre-gl"

export type MapLibreViewProps = {
  center?: [number, number]
  zoom?: number
  className?: string
}

export function MapLibreView({
  center = [-93.6091, 41.6005],
  zoom = 6.5,
  className = "h-[520px] w-full rounded-xl border border-border bg-muted/20",
}: MapLibreViewProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<MapLibreMap | null>(null)

  useEffect(() => {
    let cancelled = false

    async function init() {
      const { Map } = await import("maplibre-gl")
      if (cancelled || !mapContainer.current) return

      const mapInstance = new Map({
        container: mapContainer.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center,
        zoom,
      })

      mapRef.current = mapInstance
    }

    init()

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [center, zoom])

  return <div ref={mapContainer} className={className} />
}
