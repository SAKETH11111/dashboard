import { z } from "zod"

import { jsonError, jsonSuccess, parseQuery } from "@/lib/water/api-helpers"
import { getIowaNitriteSeries } from "@/lib/water/iowa-datasources"
import { waterLogger } from "@/lib/water/logger"

export const revalidate = 1800

const querySchema = z.object({
  systemId: z.string().optional(),
})

export async function GET(request: Request) {
  const parsed = parseQuery(request, querySchema)

  if (!parsed.success) {
    waterLogger.warn("api-nitrite", "Invalid query parameters", parsed.error.flatten())
    return jsonError("Invalid query parameters", 400, parsed.error.flatten())
  }

  try {
    const data = await getIowaNitriteSeries(parsed.data)
    waterLogger.info("api-nitrite", "Served nitrite series", {
      systemId: parsed.data.systemId ?? data.systemId,
      points: data.points.length,
    })
    return jsonSuccess(data)
  } catch (error) {
    waterLogger.error("api-nitrite", "Failed to load nitrite data", error)
    return jsonError("Unable to load nitrite data", 500)
  }
}

