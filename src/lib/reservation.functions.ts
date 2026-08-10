import { createServerFn } from "@tanstack/react-start";

export const salonPublicFn = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => ({ slug: String(data.slug).slice(0, 120) }))
  .handler(async ({ data }) => {
    const { chargerSalonPublic } = await import("./reservation.server");
    return chargerSalonPublic(data.slug);
  });

export const creneauxFn = createServerFn({ method: "GET" })
  .inputValidator(
    (data: {
      slug: string;
      prestationId: string;
      employeId: string | null;
      depart: string;
      jours?: number;
    }) => ({
      slug: String(data.slug).slice(0, 120),
      prestationId: String(data.prestationId),
      employeId: data.employeId ? String(data.employeId) : null,
      depart: String(data.depart).slice(0, 10),
      jours: Math.min(Math.max(data.jours ?? 7, 1), 14),
    }),
  )
  .handler(async ({ data }) => {
    const { chargerCreneaux } = await import("./reservation.server");
    return chargerCreneaux(data);
  });

export const creerReservationFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      slug: string;
      prestationId: string;
      employeId: string | null;
      debut: string;
      nom: string;
      telephone: string;
      email: string;
    }) => {
      const nom = String(data.nom ?? "").trim();
      if (nom.length < 2) throw new Error("Merci d'indiquer votre nom.");
      const telephone = String(data.telephone ?? "").trim();
      if (telephone.replace(/\D/g, "").length < 6)
        throw new Error("Merci d'indiquer un numéro de téléphone valide.");
      const email = String(data.email ?? "").trim();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new Error("Adresse email invalide.");
      return {
        slug: String(data.slug).slice(0, 120),
        prestationId: String(data.prestationId),
        employeId: data.employeId ? String(data.employeId) : null,
        debut: String(data.debut),
        nom: nom.slice(0, 120),
        telephone: telephone.slice(0, 40),
        email: email.slice(0, 160),
      };
    },
  )
  .handler(async ({ data }) => {
    const { creerReservationPublique } = await import("./reservation.server");
    return creerReservationPublique(data);
  });

export const reservationFn = createServerFn({ method: "GET" })
  .inputValidator((data: { token: string }) => ({ token: String(data.token).slice(0, 60) }))
  .handler(async ({ data }) => {
    const { chargerReservation } = await import("./reservation.server");
    return chargerReservation(data.token);
  });

export const annulerReservationFn = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string }) => ({ token: String(data.token).slice(0, 60) }))
  .handler(async ({ data }) => {
    const { annulerReservationPublique } = await import("./reservation.server");
    return annulerReservationPublique(data.token);
  });
