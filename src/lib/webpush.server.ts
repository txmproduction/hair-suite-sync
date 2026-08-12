// Web Push (RFC 8291 aes128gcm + RFC 8292 VAPID) implémenté avec WebCrypto
// pour rester compatible avec le runtime serverless (la lib npm `web-push`
// dépend de Node et ne fonctionne pas ici).

export type AbonnementPush = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

const texte = (s: string) => new TextEncoder().encode(s);

async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  longueur: number,
): Promise<Uint8Array> {
  const base = await crypto.subtle.importKey("raw", ikm as BufferSource, "HKDF", false, [

    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: salt as BufferSource, info: info as BufferSource },
    base,
    longueur * 8,
  );
  return new Uint8Array(bits);
}

async function jwtVapid(audience: string, sujet: string, clePriveeD: string, clePublique: string) {
  const pub = b64urlToBytes(clePublique);
  const jwk: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    d: clePriveeD,
    x: bytesToB64url(pub.slice(1, 33)),
    y: bytesToB64url(pub.slice(33, 65)),
    ext: true,
  };
  const cle = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, [
    "sign",
  ]);
  const entete = bytesToB64url(texte(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const corps = bytesToB64url(
    texte(
      JSON.stringify({
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + 12 * 3600,
        sub: sujet,
      }),
    ),
  );
  const aSigner = texte(`${entete}.${corps}`);
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cle,
    aSigner as BufferSource,
  );
  return `${entete}.${corps}.${bytesToB64url(new Uint8Array(signature))}`;
}

async function chiffrer(abonnement: AbonnementPush, charge: string): Promise<Uint8Array> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const paire = (await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, [
    "deriveBits",
  ])) as CryptoKeyPair;
  const localPub = new Uint8Array(await crypto.subtle.exportKey("raw", paire.publicKey));

  const clientPubBytes = b64urlToBytes(abonnement.p256dh);
  const clientPub = await crypto.subtle.importKey(
    "raw",
    clientPubBytes as BufferSource,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );
  const partage = new Uint8Array(
    await crypto.subtle.deriveBits({ name: "ECDH", public: clientPub }, paire.privateKey, 256),
  );

  const authSecret = b64urlToBytes(abonnement.auth);
  const infoPrk = concat(texte("WebPush: info\0"), clientPubBytes, localPub);
  const prk = await hkdf(authSecret, partage, infoPrk, 32);
  const cek = await hkdf(salt, prk, texte("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, prk, texte("Content-Encoding: nonce\0"), 12);

  const cleAes = await crypto.subtle.importKey("raw", cek as BufferSource, "AES-GCM", false, [
    "encrypt",
  ]);
  const clair = concat(texte(charge), new Uint8Array([2]));
  const chiffre = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce as BufferSource },
      cleAes,
      clair as BufferSource,
    ),
  );

  const tailleEnregistrement = new Uint8Array(4);
  new DataView(tailleEnregistrement.buffer).setUint32(0, 4096);
  return concat(salt, tailleEnregistrement, new Uint8Array([localPub.length]), localPub, chiffre);
}

/** Envoie une notification. Retourne le code HTTP du service push. */
export async function envoyerPush(
  abonnement: AbonnementPush,
  charge: Record<string, unknown>,
): Promise<number> {
  const clePrivee = process.env["VAPID_PRIVATE_KEY"];
  const clePublique = process.env["VAPID_PUBLIC_KEY"];
  const sujet = process.env["VAPID_SUBJECT"] || "mailto:contact@hairtrack.fr";
  if (!clePrivee || !clePublique) throw new Error("Clés VAPID manquantes.");

  const audience = new URL(abonnement.endpoint).origin;
  const jwt = await jwtVapid(audience, sujet, clePrivee, clePublique);
  const corps = await chiffrer(abonnement, JSON.stringify(charge));

  const reponse = await fetch(abonnement.endpoint, {
    method: "POST",
    headers: {
      Authorization: `vapid t=${jwt}, k=${clePublique}`,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "86400",
      Urgency: "high",
    },
    body: corps as BodyInit,
  });
  return reponse.status;
}
