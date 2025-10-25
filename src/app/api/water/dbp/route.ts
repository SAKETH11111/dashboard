import { z } from "zod"

import { csvResponse, jsonError, jsonSuccess, parseQuery, waterSeriesToCsv } from "@/lib/water/api-helpers"
import { getIowaDbpSeries } from "@/lib/water/iowa-datasources"
import { waterLogger } from "@/lib/water/logger"

export const revalidate = 3600

const querySchema = z.object({
  systemId: z.string().optional(),
  kind: z.enum(["tthm", "haa5"]).optional(),
  format: z.enum(["json", "csv"]).optional(),
})

export async function GET(request: Request) {
  const parsed = parseQuery(request, querySchema)

  if (!parsed.success) {
    waterLogger.warn("api-dbp", "Invalid query parameters", parsed.error.flatten())
    return jsonError("Invalid query parameters", 400, parsed.error.flatten())
  }

  try {
    const { format = "json", ...filters } = parsed.data
    const data = await getIowaDbpSeries(filters)
    waterLogger.info("api-dbp", "Served DBP series", {
      systemId: filters.systemId ?? data.systemId,
      points: data.points.length,
    })
    if (format === "csv") {
      return csvResponse(waterSeriesToCsv(data), `${filters.kind ?? "dbp"}.csv`)
    }
    return jsonSuccess(data)
  } catch (error) {
    waterLogger.error("api-dbp", "Failed to load DBP data", error)
    return jsonError("Unable to load DBP data", 500)
  }
}
