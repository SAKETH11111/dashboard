import { NextResponse } from "next/server"

import { getGISTEMPMonthly } from "@/lib/datasources"

export const runtime = "nodejs"
export const revalidate = 86400 // Cache for 24 hours
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const series = await getGISTEMPMonthly()
    return NextResponse.json({
      metric: "temp-anomaly",
      unit: "°C",
      source: "NASA GISTEMP v4 (land+ocean)",
      baseline: "1951-1980",
      updatedAt: new Date().toISOString(),
      points: series,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


