import { z } from "zod"

import { csvResponse, jsonError, jsonSuccess, parseQuery, waterSeriesToCsv } from "@/lib/water/api-helpers"
import { getIowaNitrateSeries } from "@/lib/water/iowa-datasources"
import { waterLogger } from "@/lib/water/logger"

export const revalidate = 1800

const querySchema = z.object({
  systemId: z.string().optional(),
  zip: z.string().optional(),
  format: z.enum(["json", "csv"]).optional(),
})

export async function GET(request: Request) {
  const parsed = parseQuery(request, querySchema)

  if (!parsed.success) {
    waterLogger.warn("api-nitrate", "Invalid query parameters", parsed.error.flatten())
    return jsonError("Invalid query parameters", 400, parsed.error.flatten())
  }

  try {
    const { format = "json", ...filters } = parsed.data
    const data = await getIowaNitrateSeries(filters)
    waterLogger.info("api-nitrate", "Served nitrate series", {
      systemId: filters.systemId ?? data.systemId,
      points: data.points.length,
    })
    if (format === "csv") {
      return csvResponse(waterSeriesToCsv(data), "nitrate.csv")
    }
    return jsonSuccess(data)
  } catch (error) {
    waterLogger.error("api-nitrate", "Failed to load nitrate data", error)
    return jsonError("Unable to load nitrate data", 500)
  }
}
