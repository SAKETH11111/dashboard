import { NextResponse } from "next/server"

import { getElectricityMixAnnual } from "@/lib/datasources"

export const runtime = "nodejs"
export const revalidate = 86400
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const series = await getElectricityMixAnnual()
    return NextResponse.json({
      metric: "electricity-mix",
      unit: "%",
      source: "Our World in Data (Global Renewables Share)",
      updatedAt: new Date().toISOString(),
      points: series,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
