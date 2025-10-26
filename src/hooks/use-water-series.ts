"use client"

import { useMemo } from "react"
import { useQuery, type UseQueryOptions } from "@tanstack/react-query"
import { z } from "zod"

import {
  advisorySchema,
  type Advisory,
  type ContaminantValue,
  waterSeriesResponseSchema,
  type WaterSeriesResponse,
} from "@/types/water"

type SeriesQueryParams = {
  systemId?: string
  zip?: string
  site?: string
  type?: string
  county?: string
}

function buildQuery(params?: SeriesQueryParams) {
  const search = new URLSearchParams()
  if (!params) return ""
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      search.set(key, value)
    }
  })
  const query = search.toString()
  return query ? `?${query}` : ""
}

async function fetchWaterSeries(
  contaminant: ContaminantValue,
  params?: SeriesQueryParams,
): Promise<WaterSeriesResponse> {
  const query = buildQuery(params)
  const res = await fetch(`/api/water/${contaminant}${query}`)
  if (!res.ok) {
    throw new Error(`Failed to fetch /api/water/${contaminant}: ${res.status}`)
  }
  const json = await res.json()
  return waterSeriesResponseSchema.parse(json)
}

const advisoriesResponseSchema = z.array(advisorySchema)

async function fetchAdvisories(params?: { type?: string }): Promise<Advisory[]> {
  const search = new URLSearchParams()
  if (params?.type) search.set("type", params.type)
  const query = search.toString()
  const res = await fetch(`/api/water/advisories${query ? `?${query}` : ""}`)
  if (!res.ok) {
    throw new Error(`Failed to fetch advisories: ${res.status}`)
  }
  const json = await res.json()
  return advisoriesResponseSchema.parse(json)
}

export function useWaterSeries(
  contaminant: ContaminantValue,
  params?: SeriesQueryParams,
  options?: Pick<UseQueryOptions<WaterSeriesResponse>, "enabled">,
) {
  const paramsKey = useMemo(() => (params ? JSON.stringify(params) : ""), [params])
  const queryKey = useMemo(() => ["water", contaminant, paramsKey], [contaminant, paramsKey])

  return useQuery({
    queryKey,
    queryFn: () => fetchWaterSeries(contaminant, params),
    staleTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
    ...options,
  })
}

export function useWaterAdvisories(
  params?: { type?: "boil" | "swim" | "pfas" },
  options?: Pick<UseQueryOptions<Advisory[]>, "enabled">,
) {
  const queryKey = useMemo(() => ["water", "advisories", params?.type ?? "all"], [params?.type])

  return useQuery({
    queryKey,
    queryFn: () => fetchAdvisories(params),
    staleTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
    ...options,
  })
}
