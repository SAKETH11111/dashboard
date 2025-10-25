import { z } from "zod"

import { csvResponse, jsonError, jsonSuccess, parseQuery, waterSeriesToCsv } from "@/lib/water/api-helpers"
import { getIowaBacteriaSeries } from "@/lib/water/iowa-datasources"
import { waterLogger } from "@/lib/water/logger"

export const revalidate = 900

const querySchema = z.object({
  systemId: z.string().optional(),
  type: z.enum(["ecoli"]).optional(),
  site: z.string().optional(),
  format: z.enum(["json", "csv"]).optional(),
})

export async function GET(request: Request) {
  const parsed = parseQuery(request, querySchema)

  if (!parsed.success) {
    waterLogger.warn("api-bacteria", "Invalid query parameters", parsed.error.flatten())
    return jsonError("Invalid query parameters", 400, parsed.error.flatten())
  }

  try {
    const { format = "json", ...filters } = parsed.data
    const data = await getIowaBacteriaSeries(filters)
    waterLogger.info("api-bacteria", "Served bacteria series", {
      site: filters.site ?? data.region,
      points: data.points.length,
    })
    if (format === "csv") {
      return csvResponse(waterSeriesToCsv(data), "bacteria.csv")
    }
    return jsonSuccess(data)
  } catch (error) {
    waterLogger.error("api-bacteria", "Failed to load bacteria data", error)
    return jsonError("Unable to load bacteria data", 500)
  }
}
