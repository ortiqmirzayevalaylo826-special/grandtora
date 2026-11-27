/** Ilova qulfi: PIN-kod va barmoq izi / yuz (WebAuthn). Faqat shu QURILMADA saqlanadi (PBKDF2 xesh).
 *  Bu qurilma himoyasi: asosiy himoya baribir parol, server qoidalari va sessiya. Ketma-ket xato PIN — hisobdan chiqarish. */
export const PIN_LENGTH = 4;
export const PIN_MAX_TRIES = 5;
export const LOCK_DEFAULT_MS = 60_000;

interface Saved { salt?: string; iter?: number; hash?: string; fails?: number; after?: number; bio?: string }
const KEY = (uid: string) => `grantora.lock.v1.${uid}`;
const enc = new TextEncoder();
const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf as ArrayBuffer)));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

function read(uid: string): Saved | null { try { return JSON.parse(localStorage.getItem(KEY(uid)) || 'null'); } catch { return null; } }
const write = (uid: string, v: Saved) => { try { localStorage.setItem(KEY(uid), JSON.stringify(v)); } catch { /* xotira to'la */ } };

async function derive(pin: string, saltB64: string, iter: number) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64(saltB64), iterations: iter }, key, 256);
  return b64(bits);
}
function same(a: string, b: string) { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }

export const isEnabled = (uid: string) => !!read(uid)?.hash;
export const lockAfter = (uid: string) => read(uid)?.after ?? LOCK_DEFAULT_MS;
export function setLockAfter(uid: string, ms: number) { const s = read(uid); if (s) write(uid, { ...s, after: ms }); }

export async function setPin(uid: string, pin: string) {
  const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
  const iter = 210_000;
  const hash = await derive(pin, salt, iter);
  const cur = read(uid) || {};
  write(uid, { ...cur, salt, iter, hash, fails: 0, after: cur.after ?? LOCK_DEFAULT_MS });
}
export async function verifyPin(uid: string, pin: string) {
  const s = read(uid);
  if (!s?.hash || !s.salt || !s.iter) return { ok: false, left: 0, exhausted: true };
  const h = await derive(pin, s.salt, s.iter);
  if (same(h, s.hash)) { write(uid, { ...s, fails: 0 }); return { ok: true, left: PIN_MAX_TRIES, exhausted: false }; }
  const fails = (s.fails || 0) + 1; // sahifani yangilab urinishlarni nolga tushirib bo'lmaydi: saqlanadi
  write(uid, { ...s, fails });
  return { ok: false, left: Math.max(0, PIN_MAX_TRIES - fails), exhausted: fails >= PIN_MAX_TRIES };
}
export const clearLock = (uid: string) => { try { localStorage.removeItem(KEY(uid)); } catch { /* */ } };
export const isWeakPin = (p: string) => /^(\d)\1+$/.test(p) || ['1234', '4321', '0123', '1212', '2580'].includes(p);

// ---- Barmoq izi / yuz ----
export async function bioSupported() {
  try { return !!(window.PublicKeyCredential && (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())); } catch { return false; }
}
export const bioEnabled = (uid: string) => !!read(uid)?.bio;
export async function enableBio(uid: string, email: string) {
  const cred = (await navigator.credentials.create({ publicKey: {
    challenge: crypto.getRandomValues(new Uint8Array(32)),
    rp: { name: 'Grantora', id: location.hostname },
    user: { id: enc.encode(uid).slice(0, 64), name: email, displayName: email },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
    authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' },
    timeout: 60_000, attestation: 'none',
  } })) as PublicKeyCredential;
  write(uid, { ...(read(uid) || {}), bio: b64(cred.rawId) });
}
export function disableBio(uid: string) { const s = read(uid); if (s) { delete s.bio; write(uid, s); } }
export async function bioUnlock(uid: string) {
  const s = read(uid);
  if (!s?.bio) return false;
  try {
    const r = await navigator.credentials.get({ publicKey: { challenge: crypto.getRandomValues(new Uint8Array(32)), allowCredentials: [{ type: 'public-key', id: unb64(s.bio) }], userVerification: 'required', timeout: 60_000 } });
    return !!r;
  } catch { return false; }
}
