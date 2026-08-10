import { createServerFn } from "@tanstack/react-start";

export const annuaireFn = createServerFn({ method: "GET" }).handler(async () => {
  const { chargerAnnuaire } = await import("./annuaire.server");
  return chargerAnnuaire();
});

export const villesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { chargerVilles } = await import("./annuaire.server");
  return chargerVilles();
});

export const rechercheFn = createServerFn({ method: "GET" })
  .inputValidator((data: { categorie?: string | null; q?: string | null; ville?: string | null; noteMin?: number | null }) => ({
    categorie: data.categorie ? String(data.categorie).slice(0, 40) : null,
    q: data.q ? String(data.q).slice(0, 80) : null,
    ville: data.ville ? String(data.ville).slice(0, 80) : null,
    noteMin: data.noteMin ? Math.min(Math.max(Number(data.noteMin), 1), 5) : null,
  }))
  .handler(async ({ data }) => {
    const { rechercherSalons } = await import("./annuaire.server");
    return rechercherSalons(data);
  });

export const ficheSalonFn = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => ({ slug: String(data.slug).slice(0, 120) }))
  .handler(async ({ data }) => {
    const { chargerFicheSalon } = await import("./annuaire.server");
    return chargerFicheSalon(data.slug);
  });

export const contexteAvisFn = createServerFn({ method: "GET" })
  .inputValidator((data: { token: string }) => ({ token: String(data.token).slice(0, 60) }))
  .handler(async ({ data }) => {
    const { chargerContexteAvis } = await import("./annuaire.server");
    return chargerContexteAvis(data.token);
  });

export const deposerAvisFn = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string; note: number; commentaire?: string; prenom?: string }) => {
    const note = Math.round(Number(data.note));
    if (!(note >= 1 && note <= 5)) throw new Error("Merci de choisir une note entre 1 et 5.");
    return {
      token: String(data.token).slice(0, 60),
      note,
      commentaire: String(data.commentaire ?? "").trim().slice(0, 1000),
      prenom: String(data.prenom ?? "").trim().slice(0, 60),
    };
  })
  .handler(async ({ data }) => {
    const { deposerAvis } = await import("./annuaire.server");
    return deposerAvis(data);
  });

export const candidatureDistributionFn = createServerFn({ method: "POST" })
  .inputValidator((data: { nom: string; telephone: string; email: string; ville: string; message?: string }) => {
    const nom = String(data.nom ?? "").trim();
    if (nom.length < 2) throw new Error("Merci d'indiquer votre nom.");
    const telephone = String(data.telephone ?? "").trim();
    if (telephone.replace(/\D/g, "").length < 6)
      throw new Error("Merci d'indiquer un numéro de téléphone valide.");
    const email = String(data.email ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Adresse email invalide.");
    const ville = String(data.ville ?? "").trim();
    if (ville.length < 2) throw new Error("Merci d'indiquer votre ville.");
    return {
      nom: nom.slice(0, 120),
      telephone: telephone.slice(0, 40),
      email: email.slice(0, 160),
      ville: ville.slice(0, 120),
      message: String(data.message ?? "").trim().slice(0, 1000),
    };
  })
  .handler(async ({ data }) => {
    const { enregistrerCandidature } = await import("./annuaire.server");
    return enregistrerCandidature(data);
  });

export const sitemapFn = createServerFn({ method: "GET" }).handler(async () => {
  const { chargerSitemap } = await import("./annuaire.server");
  return chargerSitemap();
});

export const pagesLocalesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { chargerSitemap } = await import("./annuaire.server");
  const { pages } = await chargerSitemap();
  return pages;
});

export const clicReservationManqueeFn = createServerFn({ method: "POST" })
  .inputValidator((data: { salonId: string }) => ({ salonId: String(data.salonId).slice(0, 60) }))
  .handler(async ({ data }) => {
    const { enregistrerClicManque } = await import("./annuaire.server");
    return enregistrerClicManque(data.salonId);
  });

export const infosRepriseFn = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => ({ slug: String(data.slug).slice(0, 120) }))
  .handler(async ({ data }) => {
    const { infosReprise } = await import("./annuaire.server");
    return infosReprise(data.slug);
  });
