import { NextResponse } from "next/server"

import { getCO2Daily } from "@/lib/datasources"

export const runtime = "nodejs"
export const revalidate = 86400 // Cache for 24 hours
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const series = await getCO2Daily()
    return NextResponse.json({
      metric: "co2",
      unit: "ppm",
      source: "NOAA GML Mauna Loa",
      updatedAt: new Date().toISOString(),
      points: series,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


