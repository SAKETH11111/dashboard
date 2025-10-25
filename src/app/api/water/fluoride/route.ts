import { z } from "zod"

import { csvResponse, jsonError, jsonSuccess, parseQuery, waterSeriesToCsv } from "@/lib/water/api-helpers"
import { getIowaFluorideSeries } from "@/lib/water/iowa-datasources"
import { waterLogger } from "@/lib/water/logger"

export const revalidate = 3600

const querySchema = z.object({
  systemId: z.string().optional(),
  format: z.enum(["json", "csv"]).optional(),
})

export async function GET(request: Request) {
  const parsed = parseQuery(request, querySchema)

  if (!parsed.success) {
    waterLogger.warn("api-fluoride", "Invalid query parameters", parsed.error.flatten())
    return jsonError("Invalid query parameters", 400, parsed.error.flatten())
  }

  try {
    const { format = "json", ...filters } = parsed.data
    const data = await getIowaFluorideSeries(filters)
    waterLogger.info("api-fluoride", "Served fluoride series", {
      systemId: filters.systemId ?? data.systemId,
      points: data.points.length,
    })
    if (format === "csv") {
      return csvResponse(waterSeriesToCsv(data), "fluoride.csv")
    }
    return jsonSuccess(data)
  } catch (error) {
    waterLogger.error("api-fluoride", "Failed to load fluoride data", error)
    return jsonError("Unable to load fluoride data", 500)
  }
}
