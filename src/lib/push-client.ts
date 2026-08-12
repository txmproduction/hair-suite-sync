import { clePubliquePushFn, enregistrerPushFn, supprimerPushFn } from "@/lib/push.functions";

function versUint8Array(base64url: string): Uint8Array {
  const base64 = (base64url + "=".repeat((4 - (base64url.length % 4)) % 4))
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const brut = atob(base64);
  const sortie = new Uint8Array(brut.length);
  for (let i = 0; i < brut.length; i++) sortie[i] = brut.charCodeAt(i);
  return sortie;
}

/** Le navigateur/OS supporte-t-il le Web Push ? (Safari iOS ancien : non) */
export function pushSupporte(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function cles(abonnement: PushSubscription) {
  const json = abonnement.toJSON();
  return {
    endpoint: abonnement.endpoint,
    p256dh: json.keys?.["p256dh"] ?? "",
    auth: json.keys?.["auth"] ?? "",
  };
}

/** Demande l'autorisation et enregistre l'abonnement. Ignore silencieusement si non supporté. */
export async function activerNotifications(): Promise<"ok" | "refuse" | "non_supporte"> {
  if (!pushSupporte()) return "non_supporte";
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return "refuse";

    const registration = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    const { cle } = await clePubliquePushFn();
    if (!cle) return "non_supporte";

    const existant = await registration.pushManager.getSubscription();
    const abonnement =
      existant ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: versUint8Array(cle) as BufferSource,
      }));

    await enregistrerPushFn({
      data: { ...cles(abonnement), userAgent: navigator.userAgent },
    });
    return "ok";
  } catch (erreur) {
    console.warn("[push] activation impossible", erreur);
    return "non_supporte";
  }
}

export async function desactiverNotifications(): Promise<void> {
  if (!pushSupporte()) return;
  try {
    const registration = await navigator.serviceWorker.getRegistration("/sw.js");
    const abonnement = await registration?.pushManager.getSubscription();
    if (!abonnement) return;
    await supprimerPushFn({ data: { endpoint: abonnement.endpoint } });
    await abonnement.unsubscribe();
  } catch (erreur) {
    console.warn("[push] désactivation impossible", erreur);
  }
}

export async function notificationsActives(): Promise<boolean> {
  if (!pushSupporte() || Notification.permission !== "granted") return false;
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  return !!(await registration?.pushManager.getSubscription());
}
