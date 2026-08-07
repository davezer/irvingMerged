const DEFAULT_ITERATIONS = 210_000;
const HASH_BITS = 256;
const SALT_BYTES = 16;

function bytesToHex(bytes) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  const value = String(hex || '').trim().toLowerCase();
  if (!value || value.length % 2 !== 0 || /[^0-9a-f]/.test(value)) return null;

  const bytes = new Uint8Array(value.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function constantTimeEqual(a, b) {
  if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array)) return false;
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function derivePasswordBytes(password, saltBytes, iterations) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(String(password)),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: saltBytes,
      iterations
    },
    key,
    HASH_BITS
  );

  return new Uint8Array(bits);
}

export function validatePassword(password) {
  const value = String(password ?? '');

  if (value.length < 10) {
    return { ok: false, error: 'Password must be at least 10 characters.' };
  }

  if (value.length > 128) {
    return { ok: false, error: 'Password must be 128 characters or fewer.' };
  }

  return { ok: true };
}

export async function hashPassword(password, iterations = DEFAULT_ITERATIONS) {
  const validation = validatePassword(password);
  if (!validation.ok) throw new Error(validation.error);

  const salt = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(salt);

  const safeIterations = Number(iterations) || DEFAULT_ITERATIONS;
  const hash = await derivePasswordBytes(password, salt, safeIterations);

  return {
    hash: bytesToHex(hash),
    salt: bytesToHex(salt),
    iterations: safeIterations
  };
}

export async function verifyPassword(password, storedHash, storedSalt, storedIterations) {
  const expected = hexToBytes(storedHash);
  const salt = hexToBytes(storedSalt);
  const iterations = Number(storedIterations);

  if (!expected || !salt || !Number.isFinite(iterations) || iterations <= 0) return false;

  const actual = await derivePasswordBytes(password, salt, iterations);
  return constantTimeEqual(actual, expected);
}
