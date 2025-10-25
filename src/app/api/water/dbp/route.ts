import { z } from "zod"

import { jsonError, jsonSuccess, parseQuery } from "@/lib/water/api-helpers"
import { getIowaDbpSeries } from "@/lib/water/iowa-datasources"
import { waterLogger } from "@/lib/water/logger"

export const revalidate = 3600

const querySchema = z.object({
  systemId: z.string().optional(),
  kind: z.enum(["tthm", "haa5"]).optional(),
})

export async function GET(request: Request) {
  const parsed = parseQuery(request, querySchema)

  if (!parsed.success) {
    waterLogger.warn("api-dbp", "Invalid query parameters", parsed.error.flatten())
    return jsonError("Invalid query parameters", 400, parsed.error.flatten())
  }

  try {
    const data = await getIowaDbpSeries(parsed.data)
    waterLogger.info("api-dbp", "Served DBP series", {
      systemId: parsed.data.systemId ?? data.systemId,
      points: data.points.length,
    })
    return jsonSuccess(data)
  } catch (error) {
    waterLogger.error("api-dbp", "Failed to load DBP data", error)
    return jsonError("Unable to load DBP data", 500)
  }
}

