import type { WeeklySummary, MetricSummary } from "@/lib/weekly-summary"

function esc(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
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

function renderMetricRow(metric: MetricSummary): string {
  const latestValue = metric.latestValue !== null ? formatValue(metric.latestValue, metric.unit) : "--"
  const delta = metric.delta !== null ? formatSigned(metric.delta, metric.unit) : "No change"
  const comparisonLabel = metric.comparisonDate
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(metric.comparisonDate))
    : "Previous period"

  const trendColor = metric.trend === "up" ? "#d93025" : metric.trend === "down" ? "#2e7d32" : "#5f6368"
  const trendEmoji = metric.trend === "up" ? "▲" : metric.trend === "down" ? "▼" : "—"

  // Use table-based layout for reliable alignment across email clients
  return `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:16px;border-collapse:separate;border-spacing:0;">
      <tr>
        <td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;border-spacing:0;">
            <tr>
              <td style="padding:12px;border:1px solid #dadce0;border-radius:12px;background:#ffffff;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td valign="middle" style="padding-right:16px;vertical-align:middle;" width="65%">
                      <div style="font-size:12px;font-weight:700;color:#1976d2;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px">${esc(metric.label)}</div>
                      <div style="font-size:26px;font-weight:800;color:#202124;line-height:1;">${esc(latestValue)}</div>
                      <div style="font-size:12px;color:#5f6368;margin-top:6px">${esc(comparisonLabel)}</div>
                    </td>
                    <td valign="middle" style="vertical-align:middle;text-align:right;" width="35%">
                      <div style="display:inline-block;font-size:14px;font-weight:700;color:${trendColor};white-space:nowrap;">
                        <span style="font-size:15px;line-height:1;vertical-align:middle">${trendEmoji}</span>
                        <span style="margin-left:6px;vertical-align:middle">${esc(delta)}</span>
                      </div>
                      <div style="font-size:12px;color:#5f6368;margin-top:6px">${esc(metric.periodLabel)}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `
}

export function renderWeeklySummaryHtml(summary: WeeklySummary, recipientName?: string): string {
  const greetingName = recipientName ? recipientName.split(" ")[0] : undefined
  const greeting = greetingName ? `Hi ${esc(greetingName)},` : "Hi,"
  const metrics = summary.metrics.map(renderMetricRow).join("")
  const generated = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(summary.generatedAt)
  )
  const sources = summary.metrics.map((m) => m.source).join(" • ")
  
  const newsSection = summary.topStories.length ? `
    <div style="margin:32px 0 0;">
      <h2 style="margin:0 0 16px;font-size:15px;text-transform:uppercase;letter-spacing:0.26em;color:#1976d2;opacity:0.9;">Top climate stories</h2>
      ${summary.topStories.map((story) => {
        const publishedDate = new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(story.publishedAt))
        return `
          <div style="margin-bottom:12px;padding:12px;border-left:3px solid #009edb;background:#f8f9fa;border-radius:4px;">
            <a href="${esc(story.link)}" style="font-size:14px;font-weight:600;color:#1976d2;text-decoration:none;display:block;margin-bottom:4px;">${esc(story.title)}</a>
            <div style="font-size:11px;color:#5f6368;">${esc(story.source)} • ${esc(publishedDate)}</div>
          </div>
        `
      }).join("")}
    </div>
  ` : ""

  return `
  <html>
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      <title>${esc(summary.headline)}</title>
    </head>
    <body style="margin:0;padding:0;background:#f1f3f4;font-family:'Roboto',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#202124;">
      <div style="width:100%;padding:36px 0;background:#e8f0fe;">
        <table align="center" width="640" cellpadding="0" cellspacing="0" role="presentation" style="width:640px;max-width:96%;background:#ffffff;border-radius:22px;border:1px solid #dadce0;overflow:hidden;box-shadow:0 20px 40px rgba(60,64,67,0.12);">
          <tr>
            <td style="padding:32px 40px 26px;border-bottom:1px solid #e8eaed;background:linear-gradient(135deg,rgba(0,158,219,0.14) 0%,rgba(25,118,210,0.08) 60%,rgba(232,240,254,0.6) 100%);">
              <span style="display:inline-flex;align-items:center;gap:10px;font-size:12px;text-transform:uppercase;letter-spacing:0.32em;color:#0b4c6f;font-weight:600;">UN Climate Pulse</span>
              <h1 style="margin:20px 0 12px;font-size:28px;line-height:1.27;font-weight:700;color:#202124;letter-spacing:-0.02em;">${esc(summary.headline)}</h1>
              <p style="margin:0;font-size:15px;line-height:1.7;color:#3c4043;max-width:520px;">
                ${greeting}<br/>
                Here's what moved across this week's key climate indicators. We watch the live feeds so you can stay focused on impact.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 18px;">
              <h2 style="margin:0 0 20px;font-size:15px;text-transform:uppercase;letter-spacing:0.26em;color:#1976d2;opacity:0.9;">Key signals</h2>
              ${metrics}
              <div style="margin:28px 0 12px;height:1px;background:linear-gradient(90deg,rgba(0,158,219,0.15) 0%,rgba(25,118,210,0.04) 90%);"></div>
              <p style="margin:0;font-size:14px;line-height:1.7;color:#3c4043;white-space:pre-line">${esc(summary.summaryText)}</p>
              ${newsSection}
              <div style="margin-top:32px;text-align:center;">
                <a href="https://un-climate.example/dashboard" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 28px;border-radius:999px;font-size:14px;font-weight:600;text-decoration:none;color:#ffffff;background:#009edb;box-shadow:0 10px 20px rgba(0,158,219,0.28);">Open live dashboard →</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 40px 34px;background:#f8f9fa;border-top:1px solid #e8eaed;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#5f6368">
                Sources: ${esc(sources)}<br/>
                Generated ${esc(generated)}<br/>
                You're receiving this update because weekly summaries are enabled in your UN Climate dashboard profile.
                <br/>
                <a href="https://un-climate.example/settings" style="color:#1976d2;text-decoration:none;">Update your preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </div>
    </body>
  </html>
  `
}


