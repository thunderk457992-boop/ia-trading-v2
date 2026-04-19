import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single()

    const plan = profile?.plan ?? "free"

    // Check monthly limit for free plan
    if (plan === "free") {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count } = await supabase
        .from("ai_analyses")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth.toISOString())

      if ((count ?? 0) >= 1) {
        return NextResponse.json(
          { error: "Limite mensuelle atteinte. Passez au plan Pro pour continuer." },
          { status: 429 }
        )
      }
    }

    const body = await request.json()
    const { riskTolerance, horizon, capital, monthlyContribution, goals, excludedCryptos } = body

    const prompt = `Tu es un conseiller en investissement crypto expert et certifié. Analyse ce profil d'investisseur et génère une allocation de portfolio optimale.

PROFIL D'INVESTISSEUR:
- Tolérance au risque: ${riskTolerance} (conservative/moderate/aggressive)
- Horizon d'investissement: ${horizon} (short < 1 an / medium 1-3 ans / long > 3 ans)
- Capital initial: ${capital}€
- Apport mensuel: ${monthlyContribution || 0}€
- Objectifs: ${goals.join(", ")}
- Cryptos à exclure: ${excludedCryptos || "aucune"}

CONDITIONS MARCHÉ ACTUELLES (Avril 2025):
- Bitcoin consolide autour de 65-68K après ATH
- Ethereum en progression avec adoption ETFs
- Altcoins en phase d'accumulation
- Sentiment général: neutre à légèrement haussier
- DXY en légère baisse, favorable aux cryptos

INSTRUCTIONS:
1. Propose une allocation sur 5-8 cryptomonnaies maximum
2. Adapte strictement au profil de risque (conservateur = BTC/ETH > 70%, agressif = altcoins ok)
3. Adapte à l'horizon (court terme = liquidité, long terme = accumulation)
4. Exclue les cryptos mentionnées
5. Fournis des rationales claires et concises
6. Inclus des warnings pertinents

Réponds UNIQUEMENT avec un JSON valide dans ce format exact:
{
  "allocations": [
    {
      "symbol": "BTC",
      "name": "Bitcoin",
      "percentage": 40,
      "rationale": "Store de valeur et actif le plus liquide du marché",
      "risk_level": "low",
      "expected_return": "+15% à +40% sur 12 mois",
      "category": "Large Cap"
    }
  ],
  "total_score": 85,
  "market_context": "Marché en phase de consolidation post-ATH, opportunité d'accumulation",
  "recommendations": [
    "Utilisez le DCA (achats réguliers) pour lisser l'entrée en position",
    "Conservez 10-20% en stablecoins pour saisir les opportunités"
  ],
  "warnings": [
    "Les cryptomonnaies sont des actifs très volatils, ne jamais investir plus que ce que vous pouvez vous permettre de perdre"
  ]
}`

    const message = await getAnthropic().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== "text") throw new Error("Réponse inattendue de l'IA")

    let analysisData
    try {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("Format JSON invalide")
      analysisData = JSON.parse(jsonMatch[0])
    } catch {
      throw new Error("Impossible de parser la réponse de l'IA")
    }

    // Save to database
    const { data: savedAnalysis, error: dbError } = await supabase
      .from("ai_analyses")
      .insert({
        user_id: user.id,
        allocations: analysisData.allocations,
        total_score: analysisData.total_score,
        market_context: analysisData.market_context,
        recommendations: analysisData.recommendations,
        warnings: analysisData.warnings,
        investor_profile: { riskTolerance, horizon, capital, monthlyContribution, goals },
      })
      .select()
      .single()

    if (dbError) {
      console.error("DB Error:", dbError)
    }

    return NextResponse.json(analysisData)
  } catch (error) {
    console.error("Advisor API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur" },
      { status: 500 }
    )
  }
}
