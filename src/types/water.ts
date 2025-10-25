import { z } from "zod"

export const waterPointSchema = z.object({
  date: z.string(),
  value: z.number().nullable(),
})

export type WaterPoint = z.infer<typeof waterPointSchema>

export const waterSeriesResponseSchema = z.object({
  metric: z.string(),
  unit: z.string(),
  source: z.string(),
  updatedAt: z.string(),
  region: z.string().optional(),
  points: z.array(waterPointSchema),
})

export type WaterSeriesResponse = z.infer<typeof waterSeriesResponseSchema>

export enum Contaminant {
  NITRATE = "nitrate",
  NITRITE = "nitrite",
  ECOLI = "ecoli",
  PFAS = "pfas",
  ARSENIC = "arsenic",
  DBP = "dbp",
  FLUORIDE = "fluoride",
}

export type Advisory = {
  id: string
  type: "boil" | "swim" | "pfas"
  title: string
  description: string
  systemId?: string
  location?: string
  issuedAt: string
  expiresAt?: string
  severity: "low" | "medium" | "high"
}

export type WaterSystem = {
  id: string
  name: string
  type: "drinking" | "recreational"
  location: {
    lat: number
    lng: number
  }
  status: "safe" | "warn" | "alert"
  lastUpdated: string
  contaminants: Contaminant[]
}
