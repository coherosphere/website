// Vendored from nostr-tools v2.10.2
// https://github.com/nbd-wtf/nostr-tools

import { schnorr } from '../crypto/secp256k1.js';
import { sha256, bytesToHex, hexToBytes } from '../crypto/sha256.js';

export function getPublicKey(privateKey) {
  const privKeyHex = privateKey instanceof Uint8Array ? bytesToHex(privateKey) : privateKey;
  const pubKeyBytes = schnorr.getPublicKey(privKeyHex);
  return bytesToHex(pubKeyBytes);
}

function serializeEvent(evt) {
  return JSON.stringify([
    0,
    evt.pubkey,
    evt.created_at,
    evt.kind,
    evt.tags,
    evt.content
  ]);
}

async function getEventHash(event) {
  const serialized = serializeEvent(event);
  const hash = await sha256(new TextEncoder().encode(serialized));
  return bytesToHex(hash);
}

export async function finalizeEvent(unsignedEvent, privateKey) {
  const privKeyHex = privateKey instanceof Uint8Array ? bytesToHex(privateKey) : privateKey;
  const pubkey = getPublicKey(privKeyHex);
  
  const event = { ...unsignedEvent, pubkey };
  const id = await getEventHash(event);
  
  const sig = await schnorr.sign(hexToBytes(id), privKeyHex);
  
  return {
    ...event,
    id,
    sig: bytesToHex(sig)
  };
}