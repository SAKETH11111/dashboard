import { z } from "zod"

import { jsonError, jsonSuccess, parseQuery } from "@/lib/water/api-helpers"
import { getWaterAdvisories } from "@/lib/water/iowa-datasources"
import { waterLogger } from "@/lib/water/logger"
import { advisoryTypeSchema } from "@/types/water"

export const revalidate = 900

const querySchema = z.object({
  type: advisoryTypeSchema.optional(),
})

export async function GET(request: Request) {
  const parsed = parseQuery(request, querySchema)

  if (!parsed.success) {
    waterLogger.warn("api-advisories", "Invalid query parameters", parsed.error.flatten())
    return jsonError("Invalid query parameters", 400, parsed.error.flatten())
  }

  try {
    const advisories = await getWaterAdvisories(parsed.data.type ? { type: parsed.data.type } : undefined)
    waterLogger.info("api-advisories", "Served advisories feed", {
      count: advisories.length,
      type: parsed.data.type ?? "all",
    })
    return jsonSuccess(advisories, {
      headers: {
        "Cache-Control": "s-maxage=900, stale-while-revalidate=600",
      },
    })
  } catch (error) {
    waterLogger.error("api-advisories", "Failed to load advisories", error)
    return jsonError("Unable to load advisories", 500)
  }
}

