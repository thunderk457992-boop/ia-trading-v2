import type { Metadata } from "next"
import Link from "next/link"
import { AxiomLogo } from "@/components/branding/AxiomLogo"
import { createClient } from "@/lib/supabase/server"
import { HomeLink } from "@/components/legal/HomeLink"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Axiom AI Terms of Use",
  description:
    "Read the terms of use for Axiom AI, including subscriptions, account access, risk warnings, and service limitations.",
  path: "/legal/cgu",
  keywords: ["Axiom AI terms", "crypto app terms of use", "Axiom AI legal"],
})

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 border-b border-slate-100 pb-2 text-lg font-bold text-slate-900">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  )
}

export default async function CGUPage() {
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
            Conditions Générales d&apos;Utilisation
          </h1>
          <p className="text-sm text-slate-400">Dernière mise à jour : 24 avril 2026</p>
        </div>

        <Section title="1. Présentation du service">
          <p>
            Axiom (ci-après « le Service ») est une application d&apos;aide à la décision en cryptomonnaies
            exploitée par <strong>Axiom</strong>. Le Service permet notamment de générer des analyses,
            des allocations indicatives, des synthèses de portefeuille et des réponses pédagogiques via
            des outils d&apos;intelligence artificielle.
          </p>
          <p>
            Les contenus fournis par le Service sont diffusés à titre strictement informatif. Ils ne
            constituent ni un conseil en investissement, ni une recommandation personnalisée, ni une
            promesse de rendement.
          </p>
        </Section>

        <Section title="2. Accès au service et acceptation des CGU">
          <p>
            L&apos;utilisation du Service implique l&apos;acceptation pleine et entière des présentes Conditions
            Générales d&apos;Utilisation. En créant un compte ou en poursuivant votre navigation dans les
            espaces authentifiés, vous reconnaissez avoir pris connaissance des présentes CGU.
          </p>
          <p>
            L&apos;accès au Service est réservé aux personnes majeures disposant de la capacité juridique
            nécessaire pour contracter.
          </p>
          <p>
            Axiom peut mettre à jour les présentes CGU afin de refléter l&apos;évolution du produit, de la
            réglementation ou des services proposés. En cas de modification substantielle, les utilisateurs
            concernés seront informés avant l&apos;entrée en vigueur des nouvelles conditions.
          </p>
        </Section>

        <Section title="3. Création de compte et sécurité">
          <p>
            Certaines fonctionnalités nécessitent la création d&apos;un compte avec une adresse email valide
            et un mot de passe personnel. L&apos;utilisateur demeure seul responsable de la confidentialité de
            ses identifiants et de toute action effectuée depuis son compte.
          </p>
          <p>
            En cas de suspicion de compromission, l&apos;utilisateur doit modifier immédiatement son mot de
            passe et contacter le support Axiom à l&apos;adresse{" "}
            <a
              href="mailto:support@axiom-trade.dev?subject=Support%20Axiom%20AI"
              className="font-semibold text-slate-900 underline underline-offset-2 hover:text-slate-700"
            >
              support@axiom-trade.dev
            </a>
            .
          </p>
          <p>
            Axiom se réserve le droit de suspendre ou de fermer un compte en cas d&apos;usage frauduleux,
            manifestement abusif ou contraire aux présentes CGU.
          </p>
        </Section>

        <Section title="4. Plans et fonctionnalités">
          <p>Le Service propose actuellement trois niveaux d&apos;accès :</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Plan Gratuit :</strong> 1 analyse IA par mois, 12 messages de chat IA par mois,
              historique limité à 3 analyses, fonctionnalités de base du dashboard.
            </li>
            <li>
              <strong>Plan Pro (24,99 € / mois ou 219,99 € / an) :</strong> 20 analyses IA par mois,
              120 messages de chat IA par mois, export PDF, plan dans le temps, signal marché détaillé
              et contexte relié aux 2 dernières analyses.
            </li>
            <li>
              <strong>Plan Premium (59,99 € / mois ou 499,99 € / an) :</strong> analyses illimitées,
              chat IA sans quota mensuel dur, historique étendu, lecture de marché approfondie,
              stratégie avancée, projections et alertes de risque.
            </li>
          </ul>
          <p>
            Les caractéristiques fonctionnelles peuvent évoluer. Les limitations et avantages réellement
            actifs sont ceux affichés dans le produit au moment de l&apos;utilisation ou de la souscription.
          </p>
        </Section>

        <Section title="5. Paiements et facturation">
          <p>
            Les paiements sont traités de manière sécurisée par Stripe. Axiom ne stocke pas les
            informations complètes de carte bancaire sur ses propres serveurs.
          </p>
          <p>
            Les abonnements payants sont renouvelés automatiquement à l&apos;échéance de chaque période
            choisie, sauf résiliation avant la date de renouvellement. Les prix sont exprimés en euros,
            toutes taxes comprises lorsqu&apos;elles sont applicables.
          </p>
          <p>
            Toute évolution tarifaire sera annoncée à l&apos;avance aux utilisateurs concernés. Les nouveaux
            tarifs ne s&apos;appliqueront pas rétroactivement à la période déjà payée.
          </p>
          <p>
            Conformément à l&apos;article L221-28 du Code de la consommation, l&apos;utilisateur reconnaît que
            certains contenus numériques et services sont accessibles immédiatement après activation de
            l&apos;abonnement et renonce, dans cette mesure, à l&apos;exercice du droit de rétractation pour la
            partie déjà exécutée.
          </p>
        </Section>

        <Section title="6. Limitation de responsabilité et avertissement sur les risques">
          <p className="font-semibold text-slate-800">
            LES ANALYSES, SCORES, ALLOCATIONS ET RÉPONSES FOURNIS PAR AXIOM N&apos;ONT PAS LA VALEUR D&apos;UN CONSEIL
            EN INVESTISSEMENT RÉGLEMENTÉ.
          </p>
          <p>
            Les cryptoactifs sont volatils et comportent un risque élevé de perte en capital, pouvant aller
            jusqu&apos;à la perte totale des montants investis.
          </p>
          <p>
            L&apos;utilisateur reste seul responsable de ses décisions patrimoniales, de ses ordres d&apos;achat ou
            de vente et, plus largement, de tout usage fait des informations fournies par le Service.
          </p>
          <p>
            Dans la limite autorisée par la loi, la responsabilité globale de Axiom ne pourra excéder le
            montant effectivement payé par l&apos;utilisateur au cours des 12 derniers mois précédant le fait
            générateur du dommage.
          </p>
        </Section>

        <Section title="7. Propriété intellectuelle">
          <p>
            Les éléments composant le Service, notamment l&apos;interface, les contenus, la marque Axiom, les
            visuels, les textes, les bases et les mécanismes d&apos;analyse, sont protégés par les droits de
            propriété intellectuelle applicables.
          </p>
          <p>
            Les analyses et rendus générés sont réservés à un usage personnel. Toute revente, reproduction
            publique, extraction massive ou réutilisation commerciale sans autorisation écrite préalable
            est interdite.
          </p>
        </Section>

        <Section title="8. Données personnelles">
          <p>
            Le traitement des données personnelles est encadré par notre{" "}
            <Link href="/legal/privacy" className="text-slate-900 underline underline-offset-2 hover:text-slate-600">
              Politique de confidentialité
            </Link>
            .
          </p>
        </Section>

        <Section title="9. Résiliation">
          <p>
            L&apos;utilisateur peut mettre fin à son abonnement depuis l&apos;espace prévu à cet effet ou via le
            portail de gestion Stripe lorsqu&apos;il est disponible. La résiliation prend effet à l&apos;échéance de
            la période déjà payée, sauf disposition légale contraire.
          </p>
          <p>
            En cas de violation grave des présentes CGU, Axiom peut suspendre ou supprimer l&apos;accès au
            Service, sans préjudice des autres recours éventuellement ouverts.
          </p>
        </Section>

        <Section title="10. Droit applicable et règlement des litiges">
          <p>
            Les présentes CGU sont soumises au droit français. En cas de différend, les parties
            s&apos;efforceront de rechercher une solution amiable avant toute action contentieuse.
          </p>
          <p>
            À défaut d&apos;accord amiable, les juridictions compétentes du ressort de Paris pourront être
            saisies, sous réserve des dispositions protectrices éventuellement applicables au consommateur.
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
            Éditeur du Service : <strong>Axiom</strong>, Paris, France
          </p>
        </Section>
      </main>

      <footer className="border-t border-slate-100 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 sm:flex-row">
          <HomeLink fallbackHref={homeHref} className="inline-flex items-center">
            <AxiomLogo showBadge={false} className="gap-2" nameClassName="text-base font-bold text-slate-900" />
          </HomeLink>
          <div className="flex items-center gap-5 text-xs text-slate-400">
            <Link href="/legal/cgu" className="font-medium text-slate-700 transition-colors hover:text-slate-700">
              CGU
            </Link>
            <Link href="/legal/privacy" className="transition-colors hover:text-slate-700">
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

