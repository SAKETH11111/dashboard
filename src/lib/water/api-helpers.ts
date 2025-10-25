import { NextResponse } from "next/server"
import { z } from "zod"

import type { Advisory, WaterSeriesResponse } from "@/types/water"

export const DEFAULT_CACHE_HEADERS = {
  "Cache-Control": "s-maxage=1800, stale-while-revalidate=900",
}

export function parseQuery<T extends z.ZodTypeAny>(request: Request, schema: T) {
  const url = new URL(request.url)
  const entries = Object.fromEntries(url.searchParams.entries())
  return schema.safeParse(entries)
}

export function jsonSuccess<T>(data: T, init: ResponseInit = {}) {
  return NextResponse.json(data, {
    ...init,
    headers: {
      ...DEFAULT_CACHE_HEADERS,
      ...(init.headers ?? {}),
    },
  })
}

export function jsonError(
  message: string,
  status: number,
  details?: unknown,
  headers?: HeadersInit,
) {
  return NextResponse.json(
    {
      error: message,
      details,
    },
    {
      status,
      headers,
    },
  )
}

const CSV_SAFE_QUOTE = /"/g

function escapeCsvValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) return ""
  const stringValue = String(value)
  if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
    return `"${stringValue.replace(CSV_SAFE_QUOTE, '""')}"`
  }
  return stringValue
}

export function waterSeriesToCsv(series: WaterSeriesResponse) {
  const header = ["date", "value", "status", "qualifier"].join(",")
  const rows = series.points.map((point) =>
    [point.date, point.value ?? "", point.status ?? "", point.qualifier ?? ""].map(escapeCsvValue).join(","),
  )
  const metadata = [`# metric: ${series.metric}`, `# unit: ${series.unit}`, `# source: ${series.source}`]
  return [...metadata, header, ...rows].join("\n")
}

export function advisoriesToCsv(advisories: Advisory[]) {
  const header = [
    "id",
    "type",
    "contaminant",
    "title",
    "description",
    "issuedAt",
    "expiresAt",
    "severity",
    "status",
    "location",
  ].join(",")
  const rows = advisories.map((advisory) =>
    [
      advisory.id,
      advisory.type,
      advisory.contaminant ?? "",
      advisory.title,
      advisory.description,
      advisory.issuedAt,
      advisory.expiresAt ?? "",
      advisory.severity,
      advisory.status,
      advisory.location ?? "",
    ]
      .map(escapeCsvValue)
      .join(","),
  )
  return [header, ...rows].join("\n")
}

export function csvResponse(csv: string, filename: string) {
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"${filename}\"`,
      ...DEFAULT_CACHE_HEADERS,
    },
  })
}
