/* eslint-disable @next/next/no-head-element */
import * as React from "react"

// Duplicate minimal types to avoid server/import issues when rendering emails.
type TrendDirection = "up" | "down" | "flat"

type MetricSummary = {
  key: "co2" | "sea-ice" | "temp"
  label: string
  unit: string
  latestDate: string
  latestValue: number | null
  comparisonDate: string | null
  comparisonValue: number | null
  delta: number | null
  deltaPercent: number | null
  periodLabel: string
  trend: TrendDirection
  source: string
}

type WeeklySummary = {
  generatedAt: string
  metrics: MetricSummary[]
  headline: string
  summaryText: string
}

type WeeklySummaryEmailProps = {
  summary: WeeklySummary
  recipientName?: string
}

const containerStyle = {
  margin: "0 auto",
  padding: "24px",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
}

const headingStyle = {
  fontSize: "20px",
  fontWeight: 600,
  color: "#0f172a",
  margin: "0 0 12px",
}

const paragraphStyle = {
  margin: "0 0 16px",
  color: "#334155",
  fontSize: "14px",
  lineHeight: "1.6",
}

const metricLabelStyle = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#1e293b",
  marginBottom: "4px",
}

const metricValueStyle = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#0f172a",
}

const metricDeltaStyle = (trend: "up" | "down" | "flat") => ({
  fontSize: "12px",
  color: trend === "up" ? "#b91c1c" : trend === "down" ? "#047857" : "#475569",
})

const footerStyle = {
  marginTop: "24px",
  fontSize: "12px",
  color: "#64748b",
}

export function WeeklySummaryEmail({ summary, recipientName }: WeeklySummaryEmailProps) {
  return (
    <html>
      <head>
        <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>{summary.headline}</title>
      </head>
      <body style={{ backgroundColor: "#f1f5f9", padding: "24px", margin: 0 }}>
        <div style={containerStyle as React.CSSProperties}>
          <h1 style={headingStyle as React.CSSProperties}>{summary.headline}</h1>
          <p style={paragraphStyle as React.CSSProperties}>
            {recipientName ? `Hi ${recipientName.split(" ")[0]},` : "Hi,"}
            <br />
            Here’s your UN Climate weekly snapshot. We pulled the latest observations and deltas across core climate
            indicators.
          </p>
          <div style={{ marginBottom: "12px" }}>
            {summary.metrics.map(renderMetricRow)}
          </div>
          <p style={paragraphStyle as React.CSSProperties}>{summary.summaryText}</p>
          <hr style={{ borderColor: "#e2e8f0", margin: "24px 0" }} />
          <p style={footerStyle as React.CSSProperties}>
            Sources: {summary.metrics.map((metric) => metric.source).join(" • ")}
            <br />
            Generated {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(summary.generatedAt))}
            <br />
            You are receiving this update because weekly summaries are enabled in your UN Climate dashboard profile.
            <br />
            <a href="https://un-climate.example/settings" style={{ color: "#2563eb" }}>
              Update preferences
            </a>
          </p>
        </div>
      </body>
    </html>
  )
}

function renderMetricRow(metric: MetricSummary) {
  const latestValue = metric.latestValue !== null ? formatValue(metric.latestValue, metric.unit) : "--"
  const delta = metric.delta !== null ? formatSigned(metric.delta, metric.unit) : "No change"
  const comparisonLabel = metric.comparisonDate
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(metric.comparisonDate))
    : "Previous period"

  return (
    <div key={metric.key} style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
      <div style={{ width: "60%" }}>
        <div style={metricLabelStyle as React.CSSProperties}>{metric.label}</div>
        <div style={metricValueStyle as React.CSSProperties}>{latestValue}</div>
      </div>
      <div style={{ width: "40%", textAlign: "right" }}>
        <div style={metricDeltaStyle(metric.trend) as React.CSSProperties}>
          {delta} {metric.periodLabel}
        </div>
        <div style={{ fontSize: "11px", color: "#94a3b8" }}>{comparisonLabel}</div>
      </div>
    </div>
  )
}

function formatValue(value: number, unit: string): string {
  const rounded = Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(2)
  return unit === "%" ? `${rounded}${unit}` : `${rounded} ${unit}`
}

function formatSigned(value: number, unit: string): string {
  const sign = value > 0 ? "+" : value < 0 ? "" : ""
  const rounded = Math.abs(value) >= 100 ? value.toFixed(0) : value.toFixed(2)
  const magnitude = `${sign}${rounded}`
  return unit === "%" ? `${magnitude}${unit}` : `${magnitude} ${unit}`
}

