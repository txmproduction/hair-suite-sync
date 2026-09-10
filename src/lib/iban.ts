// Validation des coordonnées bancaires (IBAN européens + BIC).

const LONGUEURS: Record<string, number> = {
  AD: 24, AT: 20, BE: 16, BG: 22, CH: 21, CY: 28, CZ: 24, DE: 22, DK: 18, EE: 20,
  ES: 24, FI: 18, FR: 27, GB: 22, GR: 27, HR: 21, HU: 28, IE: 22, IS: 26, IT: 27,
  LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MT: 31, NL: 18, NO: 15, PL: 28, PT: 25,
  RO: 24, SE: 24, SI: 19, SK: 24, SM: 27,
};

export const normaliserIban = (v: string) => v.replace(/\s+/g, "").toUpperCase();

/** Vérifie le format, la longueur du pays et la clé de contrôle mod 97. */
export function ibanValide(brut: string): boolean {
  const iban = normaliserIban(brut);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) return false;
  const attendue = LONGUEURS[iban.slice(0, 2)];
  if (attendue && iban.length !== attendue) return false;
  const reordonne = iban.slice(4) + iban.slice(0, 4);
  let reste = 0;
  for (const c of reordonne) {
    const valeur = /\d/.test(c) ? c : String(c.charCodeAt(0) - 55);
    for (const chiffre of valeur) reste = (reste * 10 + Number(chiffre)) % 97;
  }
  return reste === 1;
}

export const bicValide = (v: string) => /^[A-Z0-9]{8}([A-Z0-9]{3})?$/.test(normaliserIban(v));

/** Affichage masqué : on ne montre que les 4 derniers caractères. */
export const ibanMasque = (iban: string) => {
  const propre = normaliserIban(iban);
  return propre.length > 8 ? `${propre.slice(0, 4)} •••• ${propre.slice(-4)}` : propre;
};

export const ibanFormate = (iban: string) =>
  normaliserIban(iban).replace(/(.{4})/g, "$1 ").trim();
