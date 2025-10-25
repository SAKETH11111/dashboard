import { mkdir, writeFile } from "fs/promises"
import path from "path"

import { applyWaterStatus } from "../../src/lib/water/alerts"
import { waterSeriesResponseSchema, type WaterSeriesResponse, type WaterStatus } from "../../src/types/water"

const OUTPUT_DIR = path.join(process.cwd(), "public", "data", "water")

export async function writeWaterSeriesToCache(series: WaterSeriesResponse) {
  const parsed = waterSeriesResponseSchema.parse(series)
  const fileName = `${parsed.contaminant === "ecoli" ? "bacteria" : parsed.contaminant}.json`
  const destination = path.join(OUTPUT_DIR, fileName)

  await mkdir(OUTPUT_DIR, { recursive: true })
  await writeFile(destination, JSON.stringify(parsed, null, 2) + "\n")

  return destination
}

type SeriesInput = Omit<WaterSeriesResponse, "status" | "points"> & {
  points: WaterSeriesResponse["points"]
  status?: WaterStatus
}

export function createSeries({
  contaminant,
  metric,
  unit,
  source,
  updatedAt,
  region,
  regionType = "system",
  systemId,
  points,
  status,
  threshold,
  advisories = [],
  notes,
}: SeriesInput): WaterSeriesResponse {
  const parsed = waterSeriesResponseSchema.parse({
    contaminant,
    metric,
    unit,
    source,
    updatedAt,
    region,
    regionType,
    systemId,
    points,
    status,
    threshold,
    advisories,
    notes,
  })

  return applyWaterStatus(parsed)
}
