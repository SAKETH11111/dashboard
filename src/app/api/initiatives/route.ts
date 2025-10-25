import { NextResponse } from "next/server"
import { promises as fs } from "node:fs"
import path from "node:path"

import { initiativesSchema, type InitiativeStatus, initiativeMetricSchema } from "@/types/initiatives"
import { z } from "zod"

export const revalidate = 43200 // 12 hours

const rawInitiativeSchema = z.object({
  id: z.string(),
  title: z.string(),
  branch: z.string(),
  region: z.string().optional(),
  status: z.string(),
  tags: z.array(z.string()).default([]),
  summary: z.string(),
  lastUpdated: z.string(),
  url: z.string().url(),
})

const statusMap: Record<string, InitiativeStatus> = {
  active: "Active",
  "in progress": "In Progress",
  ongoing: "In Progress",
  planned: "Planned",
  completed: "Completed",
}

const metricTagMap: Record<string, z.infer<typeof initiativeMetricSchema>> = {
  mitigation: "co2",
  ndc: "co2",
  policy: "finance",
  finance: "finance",
  "carbon markets": "co2",
  restoration: "resilience",
  ecosystems: "resilience",
  jobs: "resilience",
  water: "resilience",
  adaptation: "resilience",
  forests: "co2",
  reforestation: "co2",
  community: "resilience",
  energy: "co2",
  forestry: "co2",
}

function mapStatus(status: string): InitiativeStatus {
  const normalized = status.trim().toLowerCase()
  return statusMap[normalized] ?? "In Progress"
}

function deriveMetrics(tags: string[]) {
  const metrics = new Set<z.infer<typeof initiativeMetricSchema>>()
  tags.forEach((tag) => {
    const normalized = tag.trim().toLowerCase()
    if (metricTagMap[normalized]) {
      metrics.add(metricTagMap[normalized])
    }
  })
  if (!metrics.size) {
    metrics.add("resilience")
  }
  return Array.from(metrics)
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "data", "initiatives.json")
    const fileContents = await fs.readFile(filePath, "utf8")
    const parsedJson = z.array(rawInitiativeSchema).parse(JSON.parse(fileContents))

    const hydrated = parsedJson.map((item, index) => {
      const isoDate = new Date(`${item.lastUpdated}T00:00:00Z`).toISOString()
      const metrics = deriveMetrics(item.tags)
      const votes = 420 - index * 25
      const comments = Math.max(5, Math.floor(votes / 20))

      return {
        id: item.id,
        title: item.title,
        branch: item.branch,
        summary: item.summary,
        description: item.summary,
        status: mapStatus(item.status),
        tags: item.tags,
        metrics,
        link: item.url,
        votes: votes > 0 ? votes : 200,
        comments,
        lastUpdated: isoDate,
      }
    })

    const validated = initiativesSchema.parse(hydrated)

    const updatedAt = validated.reduce((latest, item) => {
      const current = new Date(item.lastUpdated).getTime()
      return current > latest ? current : latest
    }, 0)

    return NextResponse.json({
      initiatives: validated,
      updatedAt: updatedAt ? new Date(updatedAt).toISOString() : null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load initiatives"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
