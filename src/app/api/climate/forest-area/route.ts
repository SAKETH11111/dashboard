import { NextResponse } from "next/server"

import { getForestAreaAnnual } from "@/lib/datasources"

export const runtime = "nodejs"
export const revalidate = 86400
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const series = await getForestAreaAnnual()
    return NextResponse.json({
      metric: "forest-area",
      unit: "million ha",
      source: "FAO Forest Resources Assessment (curated snapshot)",
      updatedAt: new Date().toISOString(),
      points: series,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
