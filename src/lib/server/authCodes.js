function toHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generatePersonalCode() {
  // strong-ish: 20 chars base32-ish, split for readability
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0/I/1
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  // e.g. XXXX-XXXX-XXXX-XXXX
  return `${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8, 12)}-${out.slice(12, 16)}`;
}

export async function hashCode(code, salt) {
  const norm = normalizeCode(code);
  const data = new TextEncoder().encode(`${salt}:${norm}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return toHex(digest);
}

export function normalizeCode(code) {
  return String(code || '').trim().toUpperCase().replace(/\s+/g, '');
}

export function normalizeUsername(u) {
  return String(u || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}
