"use client"

import { useQuery, type UseQueryOptions } from "@tanstack/react-query"

import {
  waterSeriesResponseSchema,
  waterSeriesCollectionSchema,
  type WaterSeriesResponse,
  type WaterSeriesCollection,
  type ContaminantValue,
} from "@/types/water"

async function fetchWaterSeries(url: string): Promise<WaterSeriesResponse> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`)
  }
  const json = await res.json()
  return waterSeriesResponseSchema.parse(json)
}

async function fetchWaterSeriesCollection(url: string): Promise<WaterSeriesCollection> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`)
  }
  const json = await res.json()
  return waterSeriesCollectionSchema.parse(json)
}

export function useWaterSeries(
  contaminant: ContaminantValue,
  options?: Pick<UseQueryOptions<WaterSeriesResponse>, "enabled">
) {
  return useQuery({
    queryKey: ["water", contaminant],
    queryFn: () => fetchWaterSeries(`/api/water/${contaminant}`),
    staleTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    ...options,
  })
}

export function useWaterSeriesCollection(
  contaminants: ContaminantValue[],
  options?: Pick<UseQueryOptions<WaterSeriesCollection>, "enabled">
) {
  return useQuery({
    queryKey: ["water", "collection", contaminants.sort()],
    queryFn: () => fetchWaterSeriesCollection(`/api/water/collection?contaminants=${contaminants.join(",")}`),
    staleTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    ...options,
  })
}

export function useWaterAdvisories(
  options?: Pick<UseQueryOptions<WaterSeriesResponse>, "enabled">
) {
  return useQuery({
    queryKey: ["water", "advisories"],
    queryFn: () => fetchWaterSeries("/api/water/advisories"),
    staleTime: 1000 * 60 * 15, // 15 minutes - advisories change more frequently
    refetchOnWindowFocus: false,
    ...options,
  })
}
