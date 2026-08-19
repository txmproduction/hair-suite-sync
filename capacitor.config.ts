import type { CapacitorConfig } from "@capacitor/cli";

// HairTrack est une app avec rendu serveur (SSR) : l'app native ne peut pas embarquer
// un simple dossier statique. On charge donc le site publié dans la WebView native
// (approche standard pour un SaaS SSR), et `capacitor/www` sert d'écran de secours
// si le réseau est indisponible au démarrage.
const config: CapacitorConfig = {
  appId: "fr.hairtrack.app",
  appName: "HairTrack",
  webDir: "capacitor/www",
  server: {
    // Domaine de production. Pour tester une préversion, remplacez temporairement l'URL.
    url: "https://hairtrack.fr",
    cleartext: false,
    androidScheme: "https",
    iosScheme: "https",
    // Domaines ouverts dans la WebView : le reste part dans le navigateur système
    // (Stripe Checkout, Google OAuth) comme l'exigent Apple et Google.
    allowNavigation: ["hairtrack.fr", "www.hairtrack.fr"],
  },
  ios: {
    contentInset: "always",
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1200,
      backgroundColor: "#F7F7F5",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#FFFFFF",
    },
  },
};

export default config;
