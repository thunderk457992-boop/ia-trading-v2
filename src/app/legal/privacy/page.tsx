import Link from "next/link"

function VelaLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M2 4L8 13L14 4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <span className="font-bold text-slate-900 tracking-tight">Vela</span>
    </Link>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">{title}</h2>
      <div className="space-y-3 text-slate-600 text-sm leading-relaxed">{children}</div>
    </section>
  )
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-100 bg-white/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <VelaLogo />
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-700 transition-colors">← Accueil</Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Légal</p>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-3">Politique de confidentialité</h1>
          <p className="text-slate-400 text-sm">Dernière mise à jour : 20 avril 2026</p>
        </div>

        <Section title="1. Responsable du traitement">
          <p>
            Vela SAS, ci-après « Vela », est responsable du traitement de vos données personnelles collectées via la plateforme accessible à l&apos;adresse vela.ai.
          </p>
          <p>
            Pour toute question relative à la protection de vos données, contactez-nous à : <strong>privacy@vela.ai</strong>
          </p>
        </Section>

        <Section title="2. Données collectées">
          <p>Nous collectons uniquement les données strictement nécessaires au fonctionnement du Service :</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Données d&apos;identification :</strong> adresse email, prénom et nom (optionnel), lors de la création du compte.
            </li>
            <li>
              <strong>Données de profil investisseur :</strong> tolérance au risque, horizon d&apos;investissement, capital indicatif, objectifs — nécessaires au fonctionnement de l&apos;IA.
            </li>
            <li>
              <strong>Données d&apos;utilisation :</strong> analyses générées, scores, allocations recommandées — stockées pour l&apos;historique personnel.
            </li>
            <li>
              <strong>Données de facturation :</strong> gérées exclusivement par Stripe. Vela ne stocke aucun numéro de carte bancaire.
            </li>
            <li>
              <strong>Données techniques :</strong> adresse IP, type de navigateur, logs d&apos;accès — à des fins de sécurité et de débogage.
            </li>
          </ul>
        </Section>

        <Section title="3. Finalités et base légale du traitement">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Exécution du contrat :</strong> fourniture du Service, gestion du compte, traitement des paiements.</li>
            <li><strong>Intérêt légitime :</strong> sécurité du Service, prévention des fraudes, amélioration des algorithmes d&apos;IA (données anonymisées).</li>
            <li><strong>Obligation légale :</strong> conservation des données de facturation (10 ans).</li>
            <li><strong>Consentement :</strong> envoi de communications marketing (désactivable à tout moment).</li>
          </ul>
        </Section>

        <Section title="4. Partage des données">
          <p>Vos données ne sont jamais vendues à des tiers. Elles peuvent être partagées avec :</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Supabase (Supabase Inc., USA) :</strong> base de données et authentification — hébergement UE disponible, couvert par les clauses contractuelles types de la Commission européenne.</li>
            <li><strong>Stripe (Stripe Inc., USA) :</strong> traitement des paiements — certifié PCI DSS niveau 1.</li>
            <li><strong>Anthropic (Anthropic PBC, USA) :</strong> génération des analyses IA — les prompts contiennent uniquement des données de profil anonymisées (capital, risque, horizon) sans données personnellement identifiables.</li>
            <li><strong>Vercel (Vercel Inc., USA) :</strong> hébergement de l&apos;application — SOC 2 Type II.</li>
          </ul>
          <p>
            Tous nos prestataires sont liés par des accords de traitement des données conformes au RGPD.
          </p>
        </Section>

        <Section title="5. Durée de conservation">
          <ul className="list-disc pl-5 space-y-2">
            <li>Données de compte : pendant la durée de l&apos;abonnement + 3 ans après la résiliation.</li>
            <li>Analyses IA : pendant la durée de l&apos;abonnement actif.</li>
            <li>Données de facturation : 10 ans (obligation légale).</li>
            <li>Logs techniques : 90 jours.</li>
          </ul>
        </Section>

        <Section title="6. Vos droits (RGPD)">
          <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Droit d&apos;accès :</strong> obtenir une copie de vos données personnelles.</li>
            <li><strong>Droit de rectification :</strong> corriger des données inexactes.</li>
            <li><strong>Droit à l&apos;effacement :</strong> supprimer votre compte et vos données (accessible depuis Paramètres → Compte).</li>
            <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré.</li>
            <li><strong>Droit d&apos;opposition :</strong> vous opposer à certains traitements, notamment à des fins marketing.</li>
            <li><strong>Droit à la limitation :</strong> restreindre temporairement le traitement de vos données.</li>
          </ul>
          <p>
            Pour exercer vos droits : <strong>privacy@vela.ai</strong>. Réponse sous 30 jours maximum.
          </p>
          <p>
            Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la <strong>CNIL</strong> (Commission Nationale de l&apos;Informatique et des Libertés) : www.cnil.fr.
          </p>
        </Section>

        <Section title="7. Cookies et traceurs">
          <p>
            Vela utilise uniquement les cookies strictement nécessaires au fonctionnement du Service (session d&apos;authentification). Aucun cookie publicitaire ou de tracking tiers n&apos;est déposé.
          </p>
          <p>
            Les cookies de session sont automatiquement supprimés à la fermeture du navigateur ou après 7 jours d&apos;inactivité.
          </p>
        </Section>

        <Section title="8. Sécurité">
          <p>
            Vela met en œuvre les mesures techniques et organisationnelles suivantes pour protéger vos données :
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Chiffrement SSL/TLS sur toutes les communications</li>
            <li>Mots de passe hachés avec bcrypt (via Supabase Auth)</li>
            <li>Accès aux données de production restreint et journalisé</li>
            <li>Séparation stricte des environnements de développement et production</li>
          </ul>
        </Section>

        <Section title="9. Transferts hors UE">
          <p>
            Certains de nos prestataires (Supabase, Stripe, Anthropic, Vercel) sont établis aux États-Unis. Ces transferts sont encadrés par les Clauses Contractuelles Types (CCT) de la Commission européenne, assurant un niveau de protection équivalent au RGPD.
          </p>
        </Section>

        <Section title="10. Modifications de la politique">
          <p>
            Nous nous réservons le droit de modifier la présente politique. Toute modification substantielle sera notifiée par email avec un préavis de 15 jours. La date de dernière mise à jour est indiquée en tête de document.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            DPO / Responsable données : <strong>privacy@vela.ai</strong><br />
            Vela SAS — Paris, France
          </p>
        </Section>
      </main>

      <footer className="border-t border-slate-100 bg-white py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <VelaLogo />
          <div className="flex items-center gap-5 text-xs text-slate-400">
            <Link href="/legal/cgu" className="hover:text-slate-700 transition-colors">CGU</Link>
            <Link href="/legal/privacy" className="hover:text-slate-700 transition-colors font-medium text-slate-700">Confidentialité</Link>
            <Link href="/" className="hover:text-slate-700 transition-colors">Accueil</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
