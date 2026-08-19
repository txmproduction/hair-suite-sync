# HairTrack — application iOS & Android (Capacitor)

Capacitor est installé et configuré dans le projet (`capacitor.config.ts`).
HairTrack fonctionne en rendu serveur (SSR) : l'app native charge le site publié
`https://hairtrack.fr` dans une WebView native. C'est l'approche standard pour un
SaaS SSR : chaque mise à jour web est immédiatement disponible dans l'app, sans
repasser en revue par les stores.

## 1. Générer les projets natifs (sur votre Mac / PC)

Ces commandes doivent être lancées en local (Xcode et Android Studio requis) :

```bash
git clone <votre-repo> && cd <votre-repo>
npm install

# Android (Windows, macOS ou Linux)
npx cap add android

# iOS (macOS + Xcode uniquement)
npx cap add ios

npx cap sync
```

## 2. Lancer / tester

```bash
npx cap open ios       # ouvre Xcode -> bouton Run sur un iPhone ou simulateur
npx cap open android   # ouvre Android Studio -> Run
```

Pour tester une préversion au lieu de la production, changez temporairement
`server.url` dans `capacitor.config.ts`, puis `npx cap sync`.

## 3. Identité de l'app

- Bundle ID / applicationId : `fr.hairtrack.app`
- Nom affiché : `HairTrack`
- Icône et splash : placez `icon.png` (1024×1024) et `splash.png` (2732×2732) dans
  `resources/`, puis `npx @capacitor/assets generate`.

## 4. Publication App Store (iOS)

1. Compte Apple Developer (99 $/an) + app créée dans App Store Connect avec le
   bundle ID `fr.hairtrack.app`.
2. Xcode → Signing & Capabilities → votre équipe → Product → Archive → Distribute.
3. À fournir : captures d'écran (6,7" et 5,5"), description, mots-clés, URL de
   politique de confidentialité (https://hairtrack.fr/mentions-legales), URL CGV.
4. Point de vigilance Apple (règle 4.2 « minimum functionality ») : une app qui
   n'est qu'un site web est refusée. HairTrack est un outil métier (agenda, caisse,
   clients) donc éligible, mais indiquez bien dans les notes de revue un compte de
   démonstration (identifiants du salon exemple) pour que le testeur voie l'agenda.
5. Paiements : les acomptes clients passent par Stripe = achat de service physique
   en salon, hors périmètre de l'achat in-app. L'abonnement pro, s'il est vendu
   dans l'app iOS, doit passer par les achats in-app Apple — laissez la
   souscription hors de l'app (site web) pour l'éviter.

## 5. Publication Google Play (Android)

1. Compte Google Play Console (25 $ unique).
2. Android Studio → Build → Generate Signed Bundle (AAB), gardez le keystore
   précieusement.
3. Play Console → nouvelle application → charger l'AAB en test interne puis
   production. À fournir : icône 512×512, bannière 1024×500, captures,
   questionnaire de confidentialité (Data safety) et déclaration publicitaire.
4. Pour supprimer la barre d'URL du navigateur sur les liens sortants, ajoutez
   plus tard un fichier de liens d'app (`assetlinks.json`) si nécessaire.

## 6. Notes techniques

- Stripe Checkout et Google OAuth s'ouvrent hors WebView (`allowNavigation` limite
  la navigation interne à hairtrack.fr) : c'est requis par les stores et évite les
  blocages de connexion Google dans une WebView.
- Les notifications Web Push actuelles ne fonctionnent pas dans l'app native ;
  pour des notifications natives, il faudra ajouter `@capacitor/push-notifications`
  avec Firebase (Android) et APNs (iOS).
- Le web et le déploiement Lovable ne sont pas modifiés par Capacitor.
