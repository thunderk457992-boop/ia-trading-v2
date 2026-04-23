# Déploiement sur Vercel

## Étape 1 — Pousser sur GitHub

```bash
git add .
git commit -m "Production ready"
git push origin main
```

---

## Étape 2 — Créer le projet sur Vercel

1. Aller sur [vercel.com/new](https://vercel.com/new)
2. Importer le repo GitHub
3. Framework : **Next.js** (détecté automatiquement)
4. Root directory : `.` (racine du projet)
5. **Ne pas déployer encore** — configurer les variables d'environnement d'abord

---

## Étape 3 — Variables d'environnement Vercel

Dans **Settings → Environment Variables**, ajouter :

### Supabase
| Variable | Valeur | Où trouver |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJh...` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJh...` | Supabase → Project Settings → API → service_role |

### Anthropic
| Variable | Valeur | Où trouver |
|---|---|---|
| `ANTHROPIC_API_KEY` | `sk-ant-...` | [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) |

### Stripe
| Variable | Valeur | Où trouver |
|---|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` | Stripe Dashboard → API Keys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Stripe Dashboard → Webhooks (voir Étape 5) |
| `STRIPE_PRICE_PRO_MONTHLY` | `price_...` | Stripe → Products → Pro → Monthly price |
| `STRIPE_PRICE_PRO_YEARLY` | `price_...` | Stripe → Products → Pro → Yearly price |
| `STRIPE_PRICE_PREMIUM_MONTHLY` | `price_...` | Stripe → Products → Premium → Monthly price |
| `STRIPE_PRICE_PREMIUM_YEARLY` | `price_...` | Stripe → Products → Premium → Yearly price |

### App URL
| Variable | Valeur |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://votre-domaine.vercel.app` (votre URL finale) |

---

## Étape 4 — Déployer

1. Cliquer **Deploy** sur Vercel
2. Attendre ~2 minutes
3. Vérifier que le build passe ✓

---

## Étape 5 — Configurer le Webhook Stripe

1. Aller sur [dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Cliquer **Add endpoint**
3. URL : `https://votre-domaine.vercel.app/api/stripe/webhook`
4. Sélectionner ces événements :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copier le **Signing secret** (`whsec_...`)
6. Retourner dans Vercel → Environment Variables → mettre à jour `STRIPE_WEBHOOK_SECRET`
7. **Redéployer** (Vercel → Deployments → Redeploy)

---

## Étape 6 — Configurer Supabase Auth

1. Aller dans Supabase → Authentication → URL Configuration
2. **Site URL** : `https://votre-domaine.vercel.app`
3. **Redirect URLs** : ajouter `https://votre-domaine.vercel.app/auth/callback`

---

## Étape 7 — Vérifier le flow complet

Tester dans cet ordre :

- [ ] Landing page s'affiche
- [ ] Inscription → email de confirmation reçu
- [ ] Clic sur le lien → redirigé vers `/dashboard`
- [ ] Bouton "Lancer une analyse" → formulaire → résultats IA affichés
- [ ] Dashboard → analyse sauvegardée visible
- [ ] Tarifs → clic "Passer au Pro" → Stripe Checkout s'ouvre
- [ ] Paiement test (`4242 4242 4242 4242`) → retour dashboard avec banner vert
- [ ] Réanalyse → quota Pro actif (20/mois)

---

## Domaine personnalisé (optionnel)

1. Vercel → Settings → Domains → Add Domain
2. Mettre à jour `NEXT_PUBLIC_APP_URL` avec le vrai domaine
3. Mettre à jour Supabase Auth URL Configuration
4. Mettre à jour l'URL du webhook Stripe
5. Redéployer

---

## Variables minimales pour tester (sans Stripe)

Si vous voulez tester l'IA sans Stripe, les 4 variables essentielles sont :
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
```
Les routes Stripe retourneront des erreurs mais le reste fonctionnera.
