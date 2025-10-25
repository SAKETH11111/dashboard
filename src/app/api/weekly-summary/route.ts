import { NextResponse } from "next/server"

import { buildWeeklySummary } from "@/lib/weekly-summary"

export const revalidate = 60

export async function GET() {
  try {
    const summary = await buildWeeklySummary()

    return NextResponse.json(summary, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800",
      },
    })
  } catch (error) {
    console.error("weekly-summary error", error)
    return NextResponse.json(
      { error: "Unable to generate weekly summary" },
      { status: 500 }
    )
  }
}


