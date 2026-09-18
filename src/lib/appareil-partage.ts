const CLE = "hairtrack.appareil-partage";

export function tokenAppareil(): string | null {
  try {
    return localStorage.getItem(CLE);
  } catch {
    return null;
  }
}

export function enregistrerAppareil(token: string) {
  try {
    localStorage.setItem(CLE, token);
  } catch {
    /* stockage indisponible */
  }
}

export function oublierAppareil() {
  try {
    localStorage.removeItem(CLE);
  } catch {
    /* stockage indisponible */
  }
}

/** Vrai si cet appareil est une tablette partagée (retour automatique à l'écran neutre). */
export function estAppareilPartage(): boolean {
  return !!tokenAppareil();
}

/** Délai d'inactivité avant retour à l'écran « Qui êtes-vous ? ». */
export const DELAI_INACTIVITE_MS = 2 * 60 * 1000;
