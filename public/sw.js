/* Service worker HairTrack : notifications Web Push */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let charge = {};
  try {
    charge = event.data ? event.data.json() : {};
  } catch {
    charge = { titre: "HairTrack", corps: event.data ? event.data.text() : "" };
  }
  const titre = charge.titre || "HairTrack";
  event.waitUntil(
    self.registration.showNotification(titre, {
      body: charge.corps || "",
      icon: "/favicon.png",
      badge: "/favicon.png",
      tag: charge.tag || undefined,
      data: { url: charge.url || "/" },
      requireInteraction: false,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const cible = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin)
    .href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((fenetres) => {
      for (const fenetre of fenetres) {
        if (fenetre.url === cible && "focus" in fenetre) return fenetre.focus();
      }
      for (const fenetre of fenetres) {
        if ("navigate" in fenetre) return fenetre.navigate(cible).then((f) => f && f.focus());
      }
      return self.clients.openWindow(cible);
    }),
  );
});
