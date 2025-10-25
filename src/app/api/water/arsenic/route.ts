import { z } from "zod"

import { jsonError, jsonSuccess, parseQuery } from "@/lib/water/api-helpers"
import { getIowaArsenicSeries } from "@/lib/water/iowa-datasources"
import { waterLogger } from "@/lib/water/logger"

export const revalidate = 3600

const querySchema = z.object({
  systemId: z.string().optional(),
  county: z.string().optional(),
})

export async function GET(request: Request) {
  const parsed = parseQuery(request, querySchema)

  if (!parsed.success) {
    waterLogger.warn("api-arsenic", "Invalid query parameters", parsed.error.flatten())
    return jsonError("Invalid query parameters", 400, parsed.error.flatten())
  }

  try {
    const data = await getIowaArsenicSeries(parsed.data)
    waterLogger.info("api-arsenic", "Served arsenic series", {
      systemId: parsed.data.systemId ?? data.systemId,
      points: data.points.length,
    })
    return jsonSuccess(data)
  } catch (error) {
    waterLogger.error("api-arsenic", "Failed to load arsenic data", error)
    return jsonError("Unable to load arsenic data", 500)
  }
}

