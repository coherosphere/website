/*! @noble/hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
// Vendored from @noble/hashes v1.3.3
// https://github.com/paulmillr/noble-hashes

// Polyfill for Safari 14
if (!crypto.subtle && crypto.webkitSubtle) {
  crypto.subtle = crypto.webkitSubtle;
}

export async function sha256(message) {
  if (crypto && typeof crypto.subtle === 'object' && typeof crypto.subtle.digest === 'function') {
    return new Uint8Array(await crypto.subtle.digest('SHA-256', message));
  }
  throw new Error('crypto.subtle.digest is not available');
}

export function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hexToBytes(hex) {
  if (typeof hex !== 'string') throw new TypeError('hexToBytes: expected string, got ' + typeof hex);
  if (hex.length % 2) throw new Error('hexToBytes: received invalid unpadded hex');
  const array = new Uint8Array(hex.length / 2);
  for (let i = 0; i < array.length; i++) {
    const j = i * 2;
    const hexByte = hex.slice(j, j + 2);
    const byte = Number.parseInt(hexByte, 16);
    if (Number.isNaN(byte) || byte < 0) throw new Error('Invalid byte sequence');
    array[i] = byte;
  }
  return array;
}