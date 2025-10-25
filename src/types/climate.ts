import { z } from "zod"

export const climatePointSchema = z.object({
  date: z.string(),
  value: z.number().nullable(),
})

export type ClimatePoint = z.infer<typeof climatePointSchema>

export const climateSeriesResponseSchema = z.object({
  metric: z.string(),
  unit: z.string(),
  source: z.string(),
  updatedAt: z.string(),
  baseline: z.string().optional(),
  region: z.string().optional(),
  points: z.array(climatePointSchema),
})

export type ClimateSeriesResponse = z.infer<typeof climateSeriesResponseSchema>


