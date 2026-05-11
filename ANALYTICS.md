# Analytics & Monitoring — Axiom AI

## Ce qui est déjà actif

### Vercel Analytics (✅ installé)
Activé automatiquement via `<Analytics />` dans `layout.tsx`.
Visible dans : https://vercel.com/[team]/[project]/analytics

### Vercel Speed Insights (✅ installé)
Activé via `<SpeedInsights />` dans `layout.tsx`.
Mesure LCP, CLS, FCP, TTFB.

### Events trackés (`src/lib/analytics.ts`)
| Event | Trigger |
|---|---|
| `advisor_started` | Submit du formulaire advisor |
| `advisor_completed` | Analyse retournée avec succès |
| `advisor_error` | Erreur API advisor |
| `checkout_started` | Clic "Choisir Pro/Premium" |
| `checkout_success` | Retour depuis Stripe avec `?success=true` |
| `cta_clicked` | À brancher sur les CTAs home |
| `chat_message_sent` | À brancher dans ChatClient |

## À ajouter (comptes externes requis)

### PostHog (session replay + funnel)
1. Créer un compte sur https://posthog.com
2. Ajouter dans `.env.local` :
   ```
   NEXT_PUBLIC_POSTHOG_KEY=phc_xxxx
   NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
   ```
3. Ajouter le snippet dans `layout.tsx` :
   ```html
   <script>
     !function(t,e){...}(window,document,"posthog","phc_xxxx",{api_host:"https://eu.i.posthog.com"})
   </script>
   ```
4. `src/lib/analytics.ts` le détecte automatiquement via `window.posthog`

### Sentry (error monitoring)
1. Créer un compte sur https://sentry.io
2. Installer : `npm install @sentry/nextjs`
3. Exécuter : `npx @sentry/wizard@latest -i nextjs`
4. Ajouter dans `.env.local` :
   ```
   SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   SENTRY_ORG=your-org
   SENTRY_PROJECT=axiom-ai
   ```
5. Sentry capturera automatiquement les erreurs SSR + API routes

### Email support branded
Remplacer `support.axiom.support@gmail.com` dans `DashboardNav.tsx:31`
par `support@axiom-trade.dev` via Brevo ou Resend.
Brevo : Settings → Senders → Add branded sender.
