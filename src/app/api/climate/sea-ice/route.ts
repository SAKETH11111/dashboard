import { NextResponse } from "next/server"

import { getArcticSeaIceDaily } from "@/lib/datasources"

export const runtime = "nodejs"
export const revalidate = 86400 // Cache for 24 hours
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const series = await getArcticSeaIceDaily()
    return NextResponse.json({
      metric: "sea-ice",
      region: "arctic",
      unit: "million_km2",
      source: "NSIDC Sea Ice Index",
      updatedAt: new Date().toISOString(),
      points: series,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


