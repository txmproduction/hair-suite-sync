import { createServerFn } from "@tanstack/react-start";

export const pageLocaleFn = createServerFn({ method: "GET" })
  .inputValidator((data: { categorie: string; ville: string; page?: number }) => ({
    categorie: String(data.categorie ?? "").slice(0, 60),
    ville: String(data.ville ?? "").slice(0, 80),
    page: Number.isFinite(Number(data.page)) ? Math.max(1, Math.floor(Number(data.page))) : 1,
  }))
  .handler(async ({ data }) => {
    const { chargerPageLocale } = await import("./annuaire-seo.server");
    return chargerPageLocale(data.categorie, data.ville, data.page);
  });

export const pageMetierFn = createServerFn({ method: "GET" })
  .inputValidator((data: { categorie: string }) => ({
    categorie: String(data.categorie ?? "").slice(0, 60),
  }))
  .handler(async ({ data }) => {
    const { chargerPageMetier } = await import("./annuaire-seo.server");
    return chargerPageMetier(data.categorie);
  });

export const pageDepartementFn = createServerFn({ method: "GET" })
  .inputValidator((data: { categorie: string; departement: string }) => ({
    categorie: String(data.categorie ?? "").slice(0, 60),
    departement: String(data.departement ?? "").slice(0, 60),
  }))
  .handler(async ({ data }) => {
    const { chargerPageDepartement } = await import("./annuaire-seo.server");
    return chargerPageDepartement(data.categorie, data.departement);
  });

export const indexVillesFn = createServerFn({ method: "GET" }).handler(async () => {
  const { chargerIndexVilles } = await import("./annuaire-seo.server");
  return chargerIndexVilles();
});

export const indexMetiersFn = createServerFn({ method: "GET" }).handler(async () => {
  const { chargerIndexMetiers } = await import("./annuaire-seo.server");
  return chargerIndexMetiers();
});
