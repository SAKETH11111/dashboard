import { NextResponse } from "next/server"

import { getSeaLevelMonthly } from "@/lib/datasources"

export const revalidate = 86400 // Cache for 24 hours

export async function GET() {
  try {
    const series = await getSeaLevelMonthly()
    return NextResponse.json({
      metric: "sea-level",
      unit: "mm",
      source: "NASA/JPL (altimetry)",
      baseline: "1993-2008 mean",
      updatedAt: new Date().toISOString(),
      points: series,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


