import { NextResponse } from "next/server"

import { getEnsoMonthly } from "@/lib/datasources"

export const runtime = "nodejs"
export const revalidate = 86400
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const series = await getEnsoMonthly()
    return NextResponse.json({
      metric: "enso",
      unit: "°C anomaly",
      source: "NOAA CPC Niño 3.4",
      updatedAt: new Date().toISOString(),
      points: series,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

