import type { Metadata } from "next"
import Link from "next/link"
import { AxiomLogo } from "@/components/branding/AxiomLogo"
import { createClient } from "@/lib/supabase/server"
import { HomeLink } from "@/components/legal/HomeLink"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Axiom AI Privacy Policy",
  description:
    "Review how Axiom AI processes account data, portfolio inputs, subscriptions, and technical logs in its privacy policy.",
  path: "/legal/privacy",
  keywords: ["Axiom AI privacy", "crypto app privacy policy", "Axiom AI data policy"],
})

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 border-b border-slate-100 pb-2 text-lg font-bold text-slate-900">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  )
}

export default async function PrivacyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const homeHref = user ? "/dashboard" : "/"

  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <HomeLink fallbackHref={homeHref} className="inline-flex items-center">
            <AxiomLogo showBadge={false} className="gap-2" nameClassName="text-base font-bold text-slate-900" />
          </HomeLink>
          <HomeLink fallbackHref={homeHref} className="text-sm text-slate-400 transition-colors hover:text-slate-700">
            ← Accueil
          </HomeLink>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-12">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">Légal</p>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-slate-900">
            Politique de confidentialité
          </h1>
          <p className="text-sm text-slate-400">Dernière mise à jour : 24 avril 2026</p>
        </div>

        <Section title="1. Responsable du traitement">
          <p>
            <strong>Axiom</strong>, en qualité d&apos;éditeur et d&apos;exploitant du service Axiom, est
            responsable du traitement des données personnelles collectées dans le cadre de l&apos;utilisation
            de l&apos;application.
          </p>
          <p>
            Pour toute question relative à la protection des données personnelles, vous pouvez écrire à{" "}
            <strong>support@axiom-trade.dev</strong>.
          </p>
        </Section>

        <Section title="2. Données collectées">
          <p>Nous collectons uniquement les données nécessaires au fonctionnement du Service, notamment :</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Données de compte :</strong> adresse email, nom complet facultatif et informations
              d&apos;authentification gérées via Supabase Auth.
            </li>
            <li>
              <strong>Données de profil investisseur :</strong> capital indicatif, revenu mensuel,
              tolérance à la perte, horizon, fréquence d&apos;investissement, objectifs et préférences
              nécessaires à la génération des analyses.
            </li>
            <li>
              <strong>Données d&apos;usage :</strong> analyses générées, allocations recommandées, scores,
              limites de plan, historique accessible selon l&apos;abonnement et métadonnées techniques liées
              au fonctionnement du produit.
            </li>
            <li>
              <strong>Données de facturation :</strong> informations d&apos;abonnement, identifiant client
              Stripe et statut de souscription. Les données bancaires complètes restent traitées par Stripe.
            </li>
            <li>
              <strong>Données techniques :</strong> journaux d&apos;accès, adresse IP, type de navigateur et
              événements nécessaires à la sécurité, au débogage et à la fiabilité du service.
            </li>
          </ul>
        </Section>

        <Section title="3. Finalités et bases légales">
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Exécution du contrat :</strong> création du compte, fourniture des analyses, gestion
              des abonnements, accès au dashboard, au chat IA et aux limitations par plan.
            </li>
            <li>
              <strong>Intérêt légitime :</strong> sécurisation du service, prévention des abus, amélioration
              de la qualité produit et résolution des incidents techniques.
            </li>
            <li>
              <strong>Obligation légale :</strong> conservation des éléments de facturation et respect des
              obligations comptables ou réglementaires applicables.
            </li>
            <li>
              <strong>Consentement, lorsqu&apos;il est requis :</strong> certaines communications non essentielles
              ou futures fonctionnalités marketing.
            </li>
          </ul>
        </Section>

        <Section title="4. Partage des données">
          <p>Les données personnelles ne sont pas vendues. Elles peuvent être partagées avec des prestataires agissant pour notre compte, notamment :</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Supabase :</strong> authentification, base de données et infrastructure applicative.
            </li>
            <li>
              <strong>Stripe :</strong> gestion des abonnements et des paiements.
            </li>
            <li>
              <strong>Anthropic :</strong> génération de contenus IA à partir des données nécessaires à la
              réponse ou à l&apos;analyse demandée.
            </li>
            <li>
              <strong>Vercel :</strong> hébergement et exécution de l&apos;application.
            </li>
          </ul>
          <p>
            Lorsque cela est nécessaire, ces transferts sont encadrés par des garanties contractuelles
            appropriées.
          </p>
        </Section>

        <Section title="5. Durée de conservation">
          <ul className="list-disc space-y-2 pl-5">
            <li>Données de compte : pendant la durée d&apos;utilisation du compte, puis pendant la période nécessaire à la gestion des obligations légales ou des litiges éventuels.</li>
            <li>Données d&apos;analyses : selon les limites du produit, du plan souscrit et les contraintes techniques du service.</li>
            <li>Données de facturation : pendant la durée légalement requise en matière comptable et fiscale.</li>
            <li>Journaux techniques et sécurité : pendant la période strictement nécessaire à la fiabilité et à la protection du service.</li>
          </ul>
        </Section>

        <Section title="6. Vos droits">
          <p>
            Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement,
            d&apos;opposition, de limitation du traitement et, lorsque cela est applicable, de portabilité
            de vos données personnelles.
          </p>
          <p>
            Vous pouvez également demander la suppression de votre compte depuis les paramètres lorsqu&apos;une
            telle option est disponible, ou en nous écrivant à <strong>support@axiom-trade.dev</strong>.
          </p>
          <p>
            Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation
            auprès de la <strong>CNIL</strong>.
          </p>
        </Section>

        <Section title="7. Cookies et traceurs">
          <p>
            Axiom utilise principalement les cookies ou mécanismes techniques nécessaires à
            l&apos;authentification, à la sécurité de session et au bon fonctionnement de l&apos;application.
          </p>
          <p>
            Aucun cookie publicitaire tiers n&apos;est déployé à ce jour dans le cadre du fonctionnement
            standard du produit.
          </p>
        </Section>

        <Section title="8. Sécurité">
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles raisonnables pour protéger
            les données personnelles, notamment le chiffrement des communications, la restriction d&apos;accès
            aux environnements sensibles et la journalisation des opérations critiques.
          </p>
        </Section>

        <Section title="9. Transferts hors Union européenne">
          <p>
            Certains prestataires peuvent traiter des données en dehors de l&apos;Union européenne. Lorsque
            c&apos;est le cas, nous nous appuyons sur les mécanismes juridiques appropriés prévus par la
            réglementation applicable, notamment les clauses contractuelles types lorsque cela est requis.
          </p>
        </Section>

        <Section title="10. Modifications de la politique">
          <p>
            La présente politique peut évoluer pour refléter les changements du produit, de nos prestataires
            ou du cadre réglementaire. La date de mise à jour figurant en tête de page permet d&apos;identifier
            la version en vigueur.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            Support Axiom :{" "}
            <a
              href="mailto:support@axiom-trade.dev?subject=Support%20Axiom%20AI"
              className="font-semibold text-slate-900 underline underline-offset-2 hover:text-slate-700"
            >
              support@axiom-trade.dev
            </a>
            <br />
            Responsable du traitement : <strong>Axiom</strong>, Paris, France
          </p>
        </Section>
      </main>

      <footer className="border-t border-slate-100 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 sm:flex-row">
          <HomeLink fallbackHref={homeHref} className="inline-flex items-center">
            <AxiomLogo showBadge={false} className="gap-2" nameClassName="text-base font-bold text-slate-900" />
          </HomeLink>
          <div className="flex items-center gap-5 text-xs text-slate-400">
            <Link href="/legal/cgu" className="transition-colors hover:text-slate-700">
              CGU
            </Link>
            <Link href="/legal/privacy" className="font-medium text-slate-700 transition-colors hover:text-slate-700">
              Confidentialité
            </Link>
            <HomeLink fallbackHref={homeHref} className="transition-colors hover:text-slate-700">
              Accueil
            </HomeLink>
          </div>
        </div>
      </footer>
    </div>
  )
}

