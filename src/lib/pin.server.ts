/**
 * Vérification et stockage des codes PIN employés + jetons d'appareils partagés.
 * Rien de tout cela ne doit être exposé au client.
 */

const ITERATIONS = 150_000;

function b64(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function deB64(s: string) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

async function pbkdf2(pin: string, salt: Uint8Array) {
  const cle = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, [
    "deriveBits",
  ]);
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as unknown as BufferSource, iterations: ITERATIONS },
    cle,
    256,
  );
}

export async function hasherPin(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const bits = await pbkdf2(pin, salt);
  return `pbkdf2$${ITERATIONS}$${b64(salt.buffer as ArrayBuffer)}$${b64(bits)}`;
}

export async function verifierPin(pin: string, stocke: string | null): Promise<boolean> {
  if (!stocke) return false;
  const [algo, , saltB64, hashB64] = stocke.split("$");
  if (algo !== "pbkdf2" || !saltB64 || !hashB64) return false;
  const bits = await pbkdf2(pin, deB64(saltB64));
  const attendu = deB64(hashB64);
  const obtenu = new Uint8Array(bits);
  if (attendu.length !== obtenu.length) return false;
  let diff = 0;
  for (let i = 0; i < attendu.length; i++) diff |= attendu[i]! ^ obtenu[i]!;
  return diff === 0;
}

export function genererTokenAppareil(): string {
  const octets = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(octets, (o) => o.toString(16).padStart(2, "0")).join("");
}

export async function hasherToken(token: string): Promise<string> {
  const bits = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return b64(bits);
}

export function pinValide(pin: string): boolean {
  return /^\d{4,6}$/.test(pin);
}

/** E-mail interne pour un employé sans compte propre (connexion par PIN uniquement). */
export function emailInterne(employeId: string): string {
  return `employe-${employeId}@pin.hairtrack.fr`;
}
