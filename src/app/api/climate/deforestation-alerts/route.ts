import { NextResponse } from "next/server"

import { getDeforestationAlertsDaily } from "@/lib/datasources"

export const runtime = "nodejs"
export const revalidate = 86400
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const series = await getDeforestationAlertsDaily()
    return NextResponse.json({
      metric: "deforestation-alerts",
      unit: "alerts",
      source: "Global Forest Watch sample alerts",
      updatedAt: new Date().toISOString(),
      points: series,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
