import { sendEmail } from "./brevo"

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://axiom-trade.dev"
const UNSUBSCRIBE_HINT = `<p style="margin:24px 0 0;text-align:center;font-size:11px;color:#9ca3af;">
  Axiom AI · <a href="${SITE_URL}/legal/privacy" style="color:#9ca3af;">Confidentialité</a> ·
  <a href="${SITE_URL}/settings" style="color:#9ca3af;">Gérer mes préférences email</a>
</p>`

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Axiom AI</title>
</head>
<body style="margin:0;padding:0;background:#fafaf8;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;color:#111111;">
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td align="center" style="padding:32px 16px;">
    <table width="100%" style="max-width:540px;background:#ffffff;border:1px solid #e5e7eb;border-radius:20px;overflow:hidden;">
      <tr>
        <td style="padding:28px 32px 0;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;">
            <div style="width:32px;height:32px;background:#111111;border-radius:8px;display:flex;align-items:center;justify-content:center;">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 13L8 3L13 13" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M5.5 9.4H10.5" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <span style="font-size:16px;font-weight:700;color:#111111;">Axiom</span>
          </div>
          ${content}
        </td>
      </tr>
      <tr><td style="padding:0 32px 28px;">${UNSUBSCRIBE_HINT}</td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

function ctaButton(href: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
    <tr>
      <td style="background:#111111;border-radius:12px;padding:12px 24px;">
        <a href="${href}" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;display:block;">${label} →</a>
      </td>
    </tr>
  </table>`
}

// ── 1. Welcome email ─────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, firstName?: string) {
  const name = firstName ?? "là"
  const html = baseLayout(`
    <h1 style="font-size:24px;font-weight:700;color:#111111;margin:0 0 12px;">Bienvenue, ${name}.</h1>
    <p style="font-size:14px;line-height:1.7;color:#6b7280;margin:0 0 12px;">
      Votre compte Axiom AI est prêt. Le produit vous aide à transformer votre profil investisseur,
      votre budget et le contexte marché en une allocation structurée — sans jargon inutile.
    </p>
    <p style="font-size:14px;line-height:1.7;color:#6b7280;margin:0 0 12px;">
      Pour commencer, lancez votre première analyse. Décrivez votre profil, votre capital et votre horizon.
      Axiom s'occupe du reste.
    </p>
    ${ctaButton(`${SITE_URL}/advisor`, "Lancer ma première analyse")}
    <p style="font-size:12px;color:#9ca3af;margin-top:20px;line-height:1.6;">
      Axiom ne promet pas de gains. Le produit structure une stratégie rationnelle basée sur des données réelles.
    </p>
  `)

  return sendEmail({
    to: [{ email: to, name: firstName }],
    subject: "Votre compte Axiom AI est prêt",
    htmlContent: html,
  })
}

// ── 2. Comeback email (24h après inscription sans analyse) ───────────────────

export async function sendComebackEmail(to: string, firstName?: string) {
  const name = firstName ?? "là"
  const html = baseLayout(`
    <h1 style="font-size:22px;font-weight:700;color:#111111;margin:0 0 12px;">Votre plan vous attend, ${name}.</h1>
    <p style="font-size:14px;line-height:1.7;color:#6b7280;margin:0 0 12px;">
      Vous avez créé un compte hier mais n'avez pas encore lancé votre première analyse.
    </p>
    <p style="font-size:14px;line-height:1.7;color:#6b7280;margin:0 0 12px;">
      En moins de 2 minutes, vous obtenez une allocation personnalisée, un score de risque et des actions concrètes.
      Aucune connaissance crypto requise pour commencer.
    </p>
    ${ctaButton(`${SITE_URL}/advisor`, "Terminer mon plan maintenant")}
  `)

  return sendEmail({
    to: [{ email: to, name: firstName }],
    subject: "Votre plan Axiom n'est pas encore terminé",
    htmlContent: html,
  })
}

// ── 3. Weekly market digest ──────────────────────────────────────────────────

export interface MarketWeeklyData {
  btcChange7d: number
  btcDominance: number
  sentimentLabel: string
  contextNote: string
}

export async function sendWeeklyMarketEmail(
  to: string,
  data: MarketWeeklyData,
  firstName?: string
) {
  const name = firstName ?? "là"
  const btcSign = data.btcChange7d >= 0 ? "+" : ""
  const html = baseLayout(`
    <p style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.14em;color:#9ca3af;margin:0 0 8px;">
      Résumé marché hebdomadaire
    </p>
    <h1 style="font-size:22px;font-weight:700;color:#111111;margin:0 0 16px;">Cette semaine, ${name}.</h1>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
      <tr>
        <td width="33%" style="padding:12px;background:#f3f3ef;border-radius:12px;text-align:left;">
          <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">BTC 7j</div>
          <div style="font-size:18px;font-weight:700;color:${data.btcChange7d >= 0 ? "#5f8f73" : "#a26168"};margin-top:4px;">${btcSign}${data.btcChange7d.toFixed(1)}%</div>
        </td>
        <td width="4%" />
        <td width="33%" style="padding:12px;background:#f3f3ef;border-radius:12px;text-align:left;">
          <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Dominance BTC</div>
          <div style="font-size:18px;font-weight:700;color:#111111;margin-top:4px;">${data.btcDominance.toFixed(1)}%</div>
        </td>
        <td width="4%" />
        <td width="33%" style="padding:12px;background:#f3f3ef;border-radius:12px;text-align:left;">
          <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Sentiment</div>
          <div style="font-size:14px;font-weight:700;color:#111111;margin-top:4px;">${data.sentimentLabel}</div>
        </td>
      </tr>
    </table>

    <p style="font-size:14px;line-height:1.7;color:#6b7280;margin:0 0 16px;">${data.contextNote}</p>

    ${ctaButton(`${SITE_URL}/advisor`, "Mettre à jour mon analyse")}
    <p style="font-size:12px;color:#9ca3af;margin-top:16px;line-height:1.6;">
      Ce résumé est informatif. Axiom ne prédit pas les cours. Investir comporte un risque de perte en capital.
    </p>
  `)

  return sendEmail({
    to: [{ email: to, name: firstName }],
    subject: `Résumé marché — BTC ${btcSign}${data.btcChange7d.toFixed(1)}% cette semaine`,
    htmlContent: html,
  })
}

// ── 4. Upgrade reminder ──────────────────────────────────────────────────────

export async function sendUpgradeReminderEmail(to: string, firstName?: string) {
  const name = firstName ?? "là"
  const html = baseLayout(`
    <h1 style="font-size:22px;font-weight:700;color:#111111;margin:0 0 12px;">Débloquez le signal marché, ${name}.</h1>
    <p style="font-size:14px;line-height:1.7;color:#6b7280;margin:0 0 12px;">
      Vous utilisez Axiom régulièrement. Le plan Pro vous donne accès au signal marché détaillé,
      à l'export PDF, à 20 analyses par mois et à l'historique sur 10 analyses.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:16px;">
      ${["Signal marché : dominance BTC, sentiment, verdict", "Export PDF de chaque analyse", "20 analyses par mois (vs 1 en gratuit)", "Historique sur 10 analyses"].map((line) => `
      <tr>
        <td style="padding:6px 0;font-size:14px;color:#6b7280;">
          <span style="color:#111111;font-weight:600;margin-right:8px;">✓</span>${line}
        </td>
      </tr>`).join("")}
    </table>
    ${ctaButton(`${SITE_URL}/pricing`, "Voir le plan Pro — dès 24,99€/mois")}
    <p style="font-size:12px;color:#9ca3af;margin-top:16px;">Annulable à tout moment. Paiement sécurisé via Stripe.</p>
  `)

  return sendEmail({
    to: [{ email: to, name: firstName }],
    subject: "Axiom Pro : débloquez le signal marché complet",
    htmlContent: html,
  })
}
