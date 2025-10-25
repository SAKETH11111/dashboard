import { NextResponse } from "next/server"
import { renderWeeklySummaryHtml } from "@/emails/weekly-summary-html"
import { buildWeeklySummary } from "@/lib/weekly-summary"
import { getStoredPreferences } from "@/lib/user-preferences-server"
import { z } from "zod"

const RESEND_API_KEY = process.env.RESEND_API_KEY
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || "UN Climate <onboarding@resend.dev>"

export async function POST(request: Request) {
  if (!RESEND_API_KEY && !SENDGRID_API_KEY) {
    return NextResponse.json(
      { error: "Email service not configured (set RESEND_API_KEY or SENDGRID_API_KEY)" },
      { status: 500 }
    )
  }

  try {
    const preferences = await getStoredPreferences()
    const requestBody: unknown = await request.json().catch(() => ({}))
    const parsedBody = z
      .object({ overrideEmail: z.string().email().optional() })
      .safeParse(requestBody)
    const overrideEmail = parsedBody.success ? parsedBody.data.overrideEmail : undefined
    const recipientEmail = overrideEmail || preferences?.email || ""

    if (!recipientEmail) {
      return NextResponse.json(
        { error: "No recipient email configured" },
        { status: 400 }
      )
    }

    const summary = await buildWeeklySummary()
    const html = renderWeeklySummaryHtml(summary, preferences?.name)

    if (RESEND_API_KEY) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: recipientEmail,
          subject: summary.headline,
          html,
        }),
      })
      const text = await response.text().catch(() => "")
      if (!response.ok) {
        return NextResponse.json(
          { error: "Resend API error", status: response.status, message: text.slice(0, 2000) },
          { status: 502 }
        )
      }
      let parsedResponse: unknown = null
      try {
        parsedResponse = JSON.parse(text)
      } catch {}
      const resendId =
        typeof parsedResponse === "object" &&
        parsedResponse !== null &&
        "id" in parsedResponse &&
        typeof (parsedResponse as { id?: unknown }).id === "string"
          ? (parsedResponse as { id: string }).id
          : null
      return NextResponse.json({ success: true, id: resendId })
    }

    // Fallback: SendGrid single sender (no custom domain needed)
    if (SENDGRID_API_KEY) {
      const sgResponse = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SENDGRID_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: recipientEmail }],
              subject: summary.headline,
            },
          ],
          from: { email: (process.env.SENDGRID_FROM_EMAIL || "no-reply@example.com") },
          content: [
            { type: "text/plain", value: summary.summaryText },
            { type: "text/html", value: html },
          ],
        }),
      })
      if (!sgResponse.ok) {
        const sgBody = await sgResponse.text().catch(() => "")
        return NextResponse.json(
          { error: "SendGrid API error", status: sgResponse.status, message: sgBody.slice(0, 2000) },
          { status: 502 }
        )
      }
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error("weekly email error", error)
    return NextResponse.json(
      { error: "Unable to send weekly summary", message: (error as Error)?.message },
      { status: 500 }
    )
  }
}
