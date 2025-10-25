import { NextResponse } from "next/server"

import { getMethaneMonthly } from "@/lib/datasources"

export const runtime = "nodejs"
export const revalidate = 86400 // Cache for 24 hours
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const series = await getMethaneMonthly()
    return NextResponse.json({
      metric: "methane",
      unit: "ppb",
      source: "NOAA GML",
      updatedAt: new Date().toISOString(),
      points: series,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

