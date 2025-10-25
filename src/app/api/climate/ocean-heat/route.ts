import { NextResponse } from "next/server"

import { getOceanHeatContentAnnual } from "@/lib/datasources"

export const runtime = "nodejs"
export const revalidate = 86400
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const series = await getOceanHeatContentAnnual()
    return NextResponse.json({
      metric: "ocean-heat",
      unit: "10^22 J",
      source: "NOAA NCEI Ocean Heat Content",
      updatedAt: new Date().toISOString(),
      points: series,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
