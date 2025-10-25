import { z } from "zod"

import { advisoriesToCsv, csvResponse, jsonError, jsonSuccess, parseQuery } from "@/lib/water/api-helpers"
import { getWaterAdvisories } from "@/lib/water/iowa-datasources"
import { waterLogger } from "@/lib/water/logger"
import { advisoryTypeSchema } from "@/types/water"

export const revalidate = 900

const querySchema = z.object({
  type: advisoryTypeSchema.optional(),
  format: z.enum(["json", "csv"]).optional(),
})

export async function GET(request: Request) {
  const parsed = parseQuery(request, querySchema)

  if (!parsed.success) {
    waterLogger.warn("api-advisories", "Invalid query parameters", parsed.error.flatten())
    return jsonError("Invalid query parameters", 400, parsed.error.flatten())
  }

  try {
    const { format = "json", type } = parsed.data
    const advisories = await getWaterAdvisories(type ? { type } : undefined)
    waterLogger.info("api-advisories", "Served advisories feed", {
      count: advisories.length,
      type: type ?? "all",
    })
    if (format === "csv") {
      return csvResponse(advisoriesToCsv(advisories), "advisories.csv")
    }
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
