import { z } from "zod"

import { jsonError, jsonSuccess, parseQuery } from "@/lib/water/api-helpers"
import { getIowaPfasSeries } from "@/lib/water/iowa-datasources"
import { waterLogger } from "@/lib/water/logger"

export const revalidate = 3600

const querySchema = z.object({
  systemId: z.string().optional(),
})

export async function GET(request: Request) {
  const parsed = parseQuery(request, querySchema)

  if (!parsed.success) {
    waterLogger.warn("api-pfas", "Invalid query parameters", parsed.error.flatten())
    return jsonError("Invalid query parameters", 400, parsed.error.flatten())
  }

  try {
    const data = await getIowaPfasSeries(parsed.data)
    waterLogger.info("api-pfas", "Served PFAS series", {
      systemId: parsed.data.systemId ?? data.systemId,
      points: data.points.length,
    })
    return jsonSuccess(data)
  } catch (error) {
    waterLogger.error("api-pfas", "Failed to load PFAS data", error)
    return jsonError("Unable to load PFAS data", 500)
  }
}

