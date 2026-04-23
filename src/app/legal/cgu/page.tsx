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

export default function CGUPage() {
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
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-3">Conditions Générales d&apos;Utilisation</h1>
          <p className="text-slate-400 text-sm">Dernière mise à jour : 20 avril 2026</p>
        </div>

        <Section title="1. Présentation du service">
          <p>
            Vela (ci-après « le Service ») est une plateforme en ligne d&apos;aide à la décision d&apos;investissement en cryptomonnaies, éditée et exploitée par Vela SAS.
          </p>
          <p>
            Le Service propose des analyses générées par intelligence artificielle (IA) basées sur le profil de l&apos;utilisateur et les données de marché en temps réel. Ces analyses sont fournies à titre informatif uniquement et ne constituent pas des conseils financiers réglementés.
          </p>
        </Section>

        <Section title="2. Accès au service et acceptation des CGU">
          <p>
            L&apos;accès au Service est conditionné à l&apos;acceptation des présentes Conditions Générales d&apos;Utilisation. En créant un compte ou en utilisant le Service, l&apos;utilisateur accepte sans réserve les présentes CGU.
          </p>
          <p>
            L&apos;utilisation du Service est réservée aux personnes majeures (18 ans ou plus) ayant la capacité juridique de contracter.
          </p>
          <p>
            Vela se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés de toute modification substantielle par email. La poursuite de l&apos;utilisation du Service après notification vaut acceptation des nouvelles CGU.
          </p>
        </Section>

        <Section title="3. Création de compte et sécurité">
          <p>
            Pour accéder aux fonctionnalités du Service, l&apos;utilisateur doit créer un compte en fournissant une adresse email valide et un mot de passe sécurisé. L&apos;utilisateur est seul responsable de la confidentialité de ses identifiants.
          </p>
          <p>
            Toute utilisation du compte est réputée effectuée par son titulaire. En cas de perte ou de compromission des identifiants, l&apos;utilisateur doit en informer Vela sans délai à l&apos;adresse : support@vela.ai.
          </p>
          <p>
            Vela se réserve le droit de suspendre ou de clôturer tout compte en cas d&apos;utilisation frauduleuse, abusive ou contraire aux présentes CGU.
          </p>
        </Section>

        <Section title="4. Description des plans et fonctionnalités">
          <p>
            Le Service est proposé selon trois niveaux d&apos;abonnement :
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Plan Gratuit :</strong> 1 analyse IA par mois, tableau de bord de base, accès aux 8 principales cryptomonnaies.</li>
            <li><strong>Plan Pro (29€/mois ou 290€/an) :</strong> 20 analyses IA par mois, données de marché en temps réel, alertes de prix, export PDF, support prioritaire.</li>
            <li><strong>Plan Premium (79€/mois ou 790€/an) :</strong> Analyses illimitées, signaux avancés, backtesting, accès API, gestionnaire de compte dédié.</li>
          </ul>
          <p>
            Les caractéristiques des plans peuvent être modifiées. Les utilisateurs abonnés bénéficient des conditions en vigueur à la date de souscription jusqu&apos;au terme de leur période de facturation en cours.
          </p>
        </Section>

        <Section title="5. Paiements et facturation">
          <p>
            Les paiements sont traités de façon sécurisée par Stripe Inc. Vela ne stocke aucune donnée bancaire sur ses serveurs. Les abonnements sont renouvelés automatiquement à la fin de chaque période de facturation sauf résiliation avant la date d&apos;échéance.
          </p>
          <p>
            Les prix affichés sont en euros TTC. Toute modification tarifaire sera communiquée avec un préavis minimum de 30 jours par email.
          </p>
          <p>
            Conformément à l&apos;article L221-28 du Code de la consommation, l&apos;utilisateur reconnaît que le contenu numérique est accessible immédiatement après paiement et renonce expressément à son droit de rétractation de 14 jours pour les analyses générées.
          </p>
        </Section>

        <Section title="6. Limitation de responsabilité — Avertissement sur les risques">
          <p className="font-semibold text-slate-800">
            LES ANALYSES ET RECOMMANDATIONS FOURNIES PAR VELA NE CONSTITUENT PAS DES CONSEILS EN INVESTISSEMENT AU SENS DU CODE MONÉTAIRE ET FINANCIER.
          </p>
          <p>
            L&apos;investissement en cryptomonnaies comporte des risques substantiels de perte en capital pouvant aller jusqu&apos;à la perte totale des sommes investies. Les performances passées ne préjugent pas des performances futures.
          </p>
          <p>
            Vela ne peut être tenu responsable des pertes financières résultant de décisions d&apos;investissement prises sur la base des analyses fournies. L&apos;utilisateur assume l&apos;entière responsabilité de ses décisions d&apos;investissement.
          </p>
          <p>
            En aucun cas la responsabilité de Vela ne pourra dépasser le montant des sommes effectivement versées par l&apos;utilisateur au titre des 12 derniers mois d&apos;abonnement.
          </p>
        </Section>

        <Section title="7. Propriété intellectuelle">
          <p>
            L&apos;ensemble des éléments constituant le Service (interface, algorithmes, contenus, marques, logos) sont la propriété exclusive de Vela ou font l&apos;objet de licences accordées à Vela. Toute reproduction, représentation ou exploitation non autorisée est strictement interdite.
          </p>
          <p>
            Les analyses générées par l&apos;IA sont fournies sous licence personnelle, non exclusive et non transférable. L&apos;utilisateur peut les utiliser à des fins personnelles uniquement et ne peut les revendre ou les redistribuer.
          </p>
        </Section>

        <Section title="8. Données personnelles">
          <p>
            Le traitement des données personnelles est régi par notre{" "}
            <Link href="/legal/privacy" className="text-slate-900 underline underline-offset-2 hover:text-slate-600">
              Politique de confidentialité
            </Link>
            , incorporée par référence aux présentes CGU.
          </p>
        </Section>

        <Section title="9. Résiliation">
          <p>
            L&apos;utilisateur peut résilier son abonnement à tout moment depuis les paramètres de son compte ou en contactant le support. La résiliation prend effet à la fin de la période de facturation en cours, sans remboursement au prorata.
          </p>
          <p>
            En cas de violation des présentes CGU, Vela peut résilier immédiatement l&apos;accès au Service sans préavis ni remboursement.
          </p>
        </Section>

        <Section title="10. Droit applicable et règlement des litiges">
          <p>
            Les présentes CGU sont soumises au droit français. En cas de litige, une solution amiable sera recherchée en priorité. À défaut d&apos;accord, les tribunaux compétents de Paris seront seuls habilités à connaître du litige.
          </p>
          <p>
            Conformément à l&apos;article L612-1 du Code de la consommation, en cas de litige, le consommateur peut recourir gratuitement au service de médiation MEDICYS : www.medicys.fr.
          </p>
        </Section>

        <Section title="11. Contact">
          <p>
            Pour toute question relative aux présentes CGU : <strong>legal@vela.ai</strong><br />
            Pour le support technique : <strong>support@vela.ai</strong><br />
            Vela SAS — Paris, France
          </p>
        </Section>
      </main>

      <footer className="border-t border-slate-100 bg-white py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <VelaLogo />
          <div className="flex items-center gap-5 text-xs text-slate-400">
            <Link href="/legal/cgu" className="hover:text-slate-700 transition-colors font-medium text-slate-700">CGU</Link>
            <Link href="/legal/privacy" className="hover:text-slate-700 transition-colors">Confidentialité</Link>
            <Link href="/" className="hover:text-slate-700 transition-colors">Accueil</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
