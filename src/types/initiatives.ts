import { z } from "zod"

export const initiativeStatusSchema = z.enum(["Active", "In Progress", "Planned", "Completed"])

export type InitiativeStatus = z.infer<typeof initiativeStatusSchema>

export const initiativeMetricSchema = z.enum(["temp", "co2", "sea-ice", "resilience", "finance"])

export const initiativeSchema = z.object({
  id: z.string(),
  title: z.string(),
  branch: z.string(),
  summary: z.string(),
  description: z.string(),
  status: initiativeStatusSchema,
  tags: z.array(z.string()),
  metrics: z.array(initiativeMetricSchema),
  link: z.string().url(),
  votes: z.number().nonnegative(),
  comments: z.number().nonnegative(),
  lastUpdated: z.string().datetime(),
})

export type Initiative = z.infer<typeof initiativeSchema>

export const initiativesSchema = z.array(initiativeSchema)
