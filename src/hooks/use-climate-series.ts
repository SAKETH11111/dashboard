"use client"

import { useQuery, type UseQueryOptions } from "@tanstack/react-query"

import {
  climateSeriesResponseSchema,
  type ClimateSeriesResponse,
} from "@/types/climate"

async function fetchSeries(url: string): Promise<ClimateSeriesResponse> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`)
  }
  const json = await res.json()
  return climateSeriesResponseSchema.parse(json)
}

export type ClimateMetric =
  | "co2"
  | "sea-ice"
  | "temp"
  | "sea-level"
  | "methane"
  | "enso"
  | "ocean-heat"
  | "electricity-mix"
  | "forest-area"
  | "deforestation-alerts"

export function useClimateSeries(
  metric: ClimateMetric,
  options?: Pick<UseQueryOptions<ClimateSeriesResponse>, "enabled">
) {
  return useQuery({
    queryKey: ["climate", metric],
    queryFn: () => fetchSeries(`/api/climate/${metric}`),
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  })
}
