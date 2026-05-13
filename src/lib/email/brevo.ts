const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

export interface BrevoEmail {
  to: Array<{ email: string; name?: string }>
  subject: string
  htmlContent: string
  params?: Record<string, string | number>
}

function getBrevoConfig() {
  const apiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.BREVO_SENDER_EMAIL ?? "noreply@axiom-trade.dev"
  const senderName = process.env.BREVO_SENDER_NAME ?? "Axiom AI"
  return { apiKey, senderEmail, senderName }
}

export async function sendEmail(email: BrevoEmail): Promise<{ ok: boolean; error?: string }> {
  const { apiKey, senderEmail, senderName } = getBrevoConfig()

  if (!apiKey) {
    console.warn("[brevo] BREVO_API_KEY not set — email not sent:", email.subject)
    return { ok: false, error: "BREVO_API_KEY not configured" }
  }

  try {
    const res = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: senderName },
        to: email.to,
        subject: email.subject,
        htmlContent: email.htmlContent,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error("[brevo] send failed:", res.status, body)
      return { ok: false, error: `HTTP ${res.status}` }
    }

    return { ok: true }
  } catch (err) {
    console.error("[brevo] send error:", err)
    return { ok: false, error: String(err) }
  }
}
