import { differenceInCalendarDays, parseISO } from "date-fns"

import { WATER_THRESHOLDS, type ThresholdMetadata } from "@/lib/water/thresholds"
import type { WaterPoint, WaterSeriesResponse, WaterStatus } from "@/types/water"

export type WaterStatusReason = "advisory" | "value" | "stale" | "no-data"

export type WaterStatusEvaluation = {
  status: WaterStatus
  reason: WaterStatusReason
  latestValue: number | null
  latestSampleDate: string | null
  daysSinceSample: number | null
}

type EvaluateOptions = {
  threshold?: ThresholdMetadata
  now?: Date
}

const STATUS_PRIORITY: Record<WaterStatus, number> = {
  unknown: 0,
  safe: 1,
  warn: 2,
  alert: 3,
}

export function determinePointStatus(value: number | null, threshold: ThresholdMetadata): WaterStatus {
  if (value == null) return "unknown"

  if (threshold.alertLevel != null && value >= threshold.alertLevel) {
    return "alert"
  }

  if (threshold.warnLevel != null && value >= threshold.warnLevel) {
    return "warn"
  }

  if (threshold.healthAdvisory != null && value >= threshold.healthAdvisory) {
    return "warn"
  }

  return "safe"
}

function isSampleStale(point: WaterPoint | null, threshold: ThresholdMetadata, now: Date): boolean {
  if (!point?.date) return true
  const freshnessDays = threshold.freshnessDays ?? 30
  const sampleDate = parseISO(point.date)
  const days = differenceInCalendarDays(now, sampleDate)
  return Number.isFinite(days) && days > freshnessDays
}

export function evaluateWaterStatus(
  series: WaterSeriesResponse,
  options: EvaluateOptions = {},
): WaterStatusEvaluation {
  const now = options.now ?? new Date()
  const threshold = options.threshold ?? WATER_THRESHOLDS[series.contaminant]

  const latest = [...series.points]
    .reverse()
    .find((point) => point.value !== null && point.value !== undefined)
    ?? null

  const advisoryStatus =
    series.advisories?.some((advisory) => advisory.status === "alert" || advisory.type === "boil")
      ? "alert"
      : undefined

  if (advisoryStatus) {
    return {
      status: advisoryStatus,
      reason: "advisory",
      latestValue: latest?.value ?? null,
      latestSampleDate: latest?.date ?? null,
      daysSinceSample: latest?.date ? differenceInCalendarDays(now, parseISO(latest.date)) : null,
    }
  }

  if (!latest) {
    return {
      status: "unknown",
      reason: "no-data",
      latestValue: null,
      latestSampleDate: null,
      daysSinceSample: null,
    }
  }

  const valueStatus = determinePointStatus(latest.value ?? null, threshold)
  if (valueStatus === "alert") {
    return {
      status: "alert",
      reason: "value",
      latestValue: latest.value ?? null,
      latestSampleDate: latest.date ?? null,
      daysSinceSample: latest.date ? differenceInCalendarDays(now, parseISO(latest.date)) : null,
    }
  }

  const stale = isSampleStale(latest, threshold, now)
  if (stale && STATUS_PRIORITY[valueStatus] < STATUS_PRIORITY.warn) {
    return {
      status: "warn",
      reason: "stale",
      latestValue: latest.value ?? null,
      latestSampleDate: latest.date ?? null,
      daysSinceSample: latest.date ? differenceInCalendarDays(now, parseISO(latest.date)) : null,
    }
  }

  if (valueStatus === "warn") {
    return {
      status: "warn",
      reason: "value",
      latestValue: latest.value ?? null,
      latestSampleDate: latest.date ?? null,
      daysSinceSample: latest.date ? differenceInCalendarDays(now, parseISO(latest.date)) : null,
    }
  }

  return {
    status: "safe",
    reason: stale ? "stale" : "value",
    latestValue: latest.value ?? null,
    latestSampleDate: latest.date ?? null,
    daysSinceSample: latest.date ? differenceInCalendarDays(now, parseISO(latest.date)) : null,
  }
}

export function applyWaterStatus(series: WaterSeriesResponse, options: EvaluateOptions = {}) {
  const threshold = options.threshold ?? WATER_THRESHOLDS[series.contaminant]
  const evaluation = evaluateWaterStatus(series, { threshold, now: options.now })

  const points = series.points.map((point) => ({
    ...point,
    status: point.status ?? determinePointStatus(point.value ?? null, threshold),
  }))

  return {
    ...series,
    threshold: series.threshold ?? threshold,
    status: evaluation.status,
    points,
  }
}

