"use client"

import { useQuery, type UseQueryOptions } from "@tanstack/react-query"

import {
  advisorySchema,
  waterSeriesResponseSchema,
  type WaterSeriesResponse,
} from "@/types/water"
import { z } from "zod"

async function fetchWaterSeries(url: string): Promise<WaterSeriesResponse> {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`)
  }
  const json = await res.json()
  return waterSeriesResponseSchema.parse(json)
}

export type WaterMetric = 
  | "nitrate"
  | "nitrite" 
  | "bacteria"
  | "pfas"
  | "arsenic"
  | "dbp"
  | "fluoride"

export function useWaterSeries(
  metric: WaterMetric,
  options?: Pick<UseQueryOptions<WaterSeriesResponse>, "enabled"> & {
    systemId?: string
    location?: string
    type?: string
  }
) {
  const { systemId, location, type, ...queryOptions } = options || {}
  
  const params = new URLSearchParams()
  if (systemId) params.set("systemId", systemId)
  if (location) params.set("location", location)
  if (type) params.set("type", type)
  
  const queryString = params.toString()
  const url = `/api/water/${metric}${queryString ? `?${queryString}` : ""}`
  
  return useQuery({
    queryKey: ["water", metric, systemId, location, type],
    queryFn: () => fetchWaterSeries(url),
    staleTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false,
    ...queryOptions,
  })
}

export function useWaterAdvisories(options?: {
  type?: "boil" | "swim" | "pfas"
  location?: string
}) {
  const { type, location } = options || {}
  
  const params = new URLSearchParams()
  if (type) params.set("type", type)
  if (location) params.set("location", location)
  
  const queryString = params.toString()
  const url = `/api/water/advisories${queryString ? `?${queryString}` : ""}`
  
  return useQuery({
    queryKey: ["water", "advisories", type, location],
    queryFn: async () => {
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.status}`)
      }
      const json = await res.json()
      const parsed = z.array(advisorySchema).safeParse(json)
      if (!parsed.success) {
        throw new Error("Invalid advisory payload")
      }
      return parsed.data
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  })
}
