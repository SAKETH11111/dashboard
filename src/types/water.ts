import { z } from "zod"

export const contaminantSchema = z.enum([
  "nitrate",
  "nitrite",
  "ecoli",
  "pfas",
  "arsenic",
  "dbp",
  "fluoride",
])

export type ContaminantValue = z.infer<typeof contaminantSchema>

export enum Contaminant {
  NITRATE = "nitrate",
  NITRITE = "nitrite",
  ECOLI = "ecoli",
  PFAS = "pfas",
  ARSENIC = "arsenic",
  DBP = "dbp",
  FLUORIDE = "fluoride",
}

export const waterStatusSchema = z.enum(["safe", "warn", "alert", "unknown"])
export type WaterStatus = z.infer<typeof waterStatusSchema>

export const advisoryTypeSchema = z.enum(["boil", "swim", "pfas"])
export type AdvisoryType = z.infer<typeof advisoryTypeSchema>

export const advisorySeveritySchema = z.enum(["low", "medium", "high"])
export type AdvisorySeverity = z.infer<typeof advisorySeveritySchema>

export const regionTypeSchema = z.enum([
  "state",
  "county",
  "system",
  "watershed",
  "site",
  "custom",
])
export type RegionType = z.infer<typeof regionTypeSchema>

export const waterPointSchema = z.object({
  date: z.string(),
  value: z.number().nullable(),
  qualifier: z.string().optional(),
  status: waterStatusSchema.optional(),
  sampleId: z.string().optional(),
})
export type WaterPoint = z.infer<typeof waterPointSchema>

export const waterAdvisorySchema = z.object({
  id: z.string(),
  type: advisoryTypeSchema,
  contaminant: contaminantSchema.optional(),
  title: z.string(),
  summary: z.string().optional(),
  description: z.string().optional(),
  issuedAt: z.string(),
  updatedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  source: z.string().optional(),
  sourceUrl: z.string().url().optional(),
  affectedSystems: z.array(z.string()).optional(),
  location: z.string().optional(),
  severity: advisorySeveritySchema.optional(),
  status: waterStatusSchema.default("alert"),
})
export type WaterAdvisory = z.infer<typeof waterAdvisorySchema>

export const advisorySchema = waterAdvisorySchema.extend({
  description: z.string(),
  severity: advisorySeveritySchema,
})
export type Advisory = z.infer<typeof advisorySchema>

export const waterThresholdSchema = z.object({
  contaminant: contaminantSchema,
  unit: z.string(),
  mcl: z.number().optional(),
  healthAdvisory: z.number().optional(),
  warnLevel: z.number().optional(),
  alertLevel: z.number().optional(),
  notes: z.string().optional(),
})
export type WaterThreshold = z.infer<typeof waterThresholdSchema>

export const waterSeriesResponseSchema = z.object({
  contaminant: contaminantSchema,
  metric: z.string(),
  unit: z.string(),
  source: z.string(),
  sourceUrl: z.string().url().optional(),
  updatedAt: z.string(),
  region: z.string(),
  regionType: regionTypeSchema.default("system"),
  systemId: z.string().optional(),
  points: z.array(waterPointSchema),
  status: waterStatusSchema,
  threshold: waterThresholdSchema.optional(),
  advisories: z.array(waterAdvisorySchema).optional(),
  notes: z.string().optional(),
})
export type WaterSeriesResponse = z.infer<typeof waterSeriesResponseSchema>

export const waterSeriesCollectionSchema = z.object({
  data: z.array(waterSeriesResponseSchema),
  generatedAt: z.string(),
})
export type WaterSeriesCollection = z.infer<typeof waterSeriesCollectionSchema>

export type WaterSystemContaminant = {
  id: Contaminant
  systemId?: string
  site?: string
  label?: string
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
  systemId?: string
  source?: string
  notes?: string
  contaminants: WaterSystemContaminant[]
}
