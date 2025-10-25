import { NextResponse } from "next/server"
import { z } from "zod"

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

