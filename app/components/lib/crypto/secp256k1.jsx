/*! @noble/secp256k1 - MIT License (c) 2019 Paul Miller (paulmillr.com) */
// Vendored from @noble/secp256k1 v2.0.0
// https://github.com/paulmillr/noble-secp256k1

import { sha256, bytesToHex, hexToBytes } from './sha256.js';

const _0n = BigInt(0);
const _1n = BigInt(1);
const _2n = BigInt(2);
const _3n = BigInt(3);
const _8n = BigInt(8);

const CURVE = Object.freeze({
  a: _0n,
  b: BigInt(7),
  P: BigInt('0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f'),
  n: BigInt('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141'),
  h: _1n,
  Gx: BigInt('55066263022277343669578718895168534326250603453777594175500187360389116729240'),
  Gy: BigInt('32670510020758816978083085130507043184471273380659243275938904335757337482424'),
  beta: BigInt('0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee'),
});

function mod(a, b = CURVE.P) {
  const result = a % b;
  return result >= _0n ? result : b + result;
}

function pow2(x, power) {
  let res = x;
  while (power-- > _0n) {
    res *= res;
    res %= CURVE.P;
  }
  return res;
}

function sqrtMod(y) {
  const P = CURVE.P;
  const _3n = BigInt(3);
  const _6n = BigInt(6);
  const _11n = BigInt(11);
  const _22n = BigInt(22);
  const _23n = BigInt(23);
  const _44n = BigInt(44);
  const _88n = BigInt(88);
  const b2 = (y * y * y) % P;
  const b3 = (b2 * b2 * y) % P;
  const b6 = (pow2(b3, _3n) * b3) % P;
  const b9 = (pow2(b6, _3n) * b3) % P;
  const b11 = (pow2(b9, _2n) * b2) % P;
  const b22 = (pow2(b11, _11n) * b11) % P;
  const b44 = (pow2(b22, _22n) * b22) % P;
  const b88 = (pow2(b44, _44n) * b44) % P;
  const b176 = (pow2(b88, _88n) * b88) % P;
  const b220 = (pow2(b176, _44n) * b44) % P;
  const b223 = (pow2(b220, _3n) * b3) % P;
  const t1 = (pow2(b223, _23n) * b22) % P;
  const t2 = (pow2(t1, _6n) * b2) % P;
  const root = pow2(t2, _2n);
  if (pow2(root, _2n) !== y) throw new Error('Cannot find square root');
  return root;
}

function invert(number, modulo = CURVE.P) {
  if (number === _0n || modulo <= _0n) {
    throw new Error(`invert: expected positive integers, got n=${number} mod=${modulo}`);
  }
  let a = mod(number, modulo);
  let b = modulo;
  let x = _0n, y = _1n, u = _1n, v = _0n;
  while (a !== _0n) {
    const q = b / a;
    const r = b % a;
    const m = x - u * q;
    const n = y - v * q;
    b = a, a = r, x = u, y = v, u = m, v = n;
  }
  const gcd = b;
  if (gcd !== _1n) throw new Error('invert: does not exist');
  return mod(x, modulo);
}

function bytesToNumberBE(bytes) {
  return hexToNumber(bytesToHex(bytes));
}

function hexToNumber(hex) {
  if (typeof hex !== 'string') throw new TypeError('hexToNumber: expected string');
  return BigInt(hex === '' ? '0' : `0x${hex}`);
}

function numberToHexUnpadded(num) {
  const hex = num.toString(16);
  return hex.length & 1 ? `0${hex}` : hex;
}

function numberToBytesBE(num, len) {
  const hex = numberToHexUnpadded(num);
  return hexToBytes(hex.padStart(len * 2, '0'));
}

function concatBytes(...arrays) {
  const result = new Uint8Array(arrays.reduce((a, arr) => a + arr.length, 0));
  for (let i = 0, pad = 0; i < arrays.length; i++) {
    const arr = arrays[i];
    result.set(arr, pad);
    pad += arr.length;
  }
  return result;
}

const TAGGED_HASH_PREFIXES = {};
async function taggedHash(tag, ...messages) {
  let tagP = TAGGED_HASH_PREFIXES[tag];
  if (tagP === undefined) {
    const tagH = await sha256(new TextEncoder().encode(tag));
    tagP = concatBytes(tagH, tagH);
    TAGGED_HASH_PREFIXES[tag] = tagP;
  }
  return sha256(concatBytes(tagP, ...messages));
}

function isValidFieldElement(num) {
  return _0n < num && num < CURVE.P;
}

function isWithinCurveOrder(num) {
  return _0n < num && num < CURVE.n;
}

function lift_x(x) {
  if (!isValidFieldElement(x)) throw new Error('Invalid x coordinate');
  const c = mod(x * x * x + BigInt(7));
  const y = sqrtMod(c);
  const finalY = y % _2n === _0n ? y : CURVE.P - y;
  return { x, y: finalY };
}

function normalizePrivateKey(key) {
  let num;
  if (typeof key === 'bigint') {
    num = key;
  } else if (typeof key === 'number' && Number.isSafeInteger(key) && key > 0) {
    num = BigInt(key);
  } else if (typeof key === 'string') {
    if (key.length !== 64) throw new Error('Expected 32 bytes of private key');
    num = hexToNumber(key);
  } else if (key instanceof Uint8Array) {
    if (key.length !== 32) throw new Error('Expected 32 bytes of private key');
    num = bytesToNumberBE(key);
  } else {
    throw new TypeError('Expected valid private key');
  }
  if (!isWithinCurveOrder(num)) throw new Error('Expected private key: 0 < key < curve.n');
  return num;
}

function getPublicKey(privateKey, isCompressed = true) {
  const d = normalizePrivateKey(privateKey);
  const point = mul(d);
  if (isCompressed) {
    return concatBytes(new Uint8Array([point.y % _2n === _0n ? 0x02 : 0x03]), numberToBytesBE(point.x, 32));
  } else {
    return concatBytes(new Uint8Array([0x04]), numberToBytesBE(point.x, 32), numberToBytesBE(point.y, 32));
  }
}

function mul(scalar) {
  const n = normalizePrivateKey(scalar);
  let p = { x: CURVE.Gx, y: CURVE.Gy };
  let result = null;
  let bits = n.toString(2).split('').reverse();
  
  for (let bit of bits) {
    if (bit === '1') {
      result = result === null ? p : pointAdd(result, p);
    }
    p = pointDouble(p);
  }
  return result;
}

function pointAdd(p1, p2) {
  if (p1 === null) return p2;
  if (p2 === null) return p1;
  
  const { x: x1, y: y1 } = p1;
  const { x: x2, y: y2 } = p2;
  
  if (x1 === x2 && y1 === y2) return pointDouble(p1);
  if (x1 === x2) return null;
  
  const lam = mod((y2 - y1) * invert(x2 - x1));
  const x3 = mod(lam * lam - x1 - x2);
  const y3 = mod(lam * (x1 - x3) - y1);
  
  return { x: x3, y: y3 };
}

function pointDouble(p) {
  const { x, y } = p;
  const lam = mod((BigInt(3) * x * x) * invert(_2n * y));
  const x3 = mod(lam * lam - _2n * x);
  const y3 = mod(lam * (x - x3) - y);
  return { x: x3, y: y3 };
}

async function schnorrSign(message, privateKey, auxRand = new Uint8Array(32)) {
  if (typeof message === 'string') message = hexToBytes(message);
  if (!(message instanceof Uint8Array)) throw new TypeError('Expected Uint8Array message');
  if (message.length !== 32) throw new Error('Expected 32-byte message hash');
  
  crypto.getRandomValues(auxRand);
  
  const d = normalizePrivateKey(privateKey);
  const P = mul(d);
  const px = numberToBytesBE(P.x, 32);
  const d_adjusted = P.y % _2n === _0n ? d : CURVE.n - d;
  
  const t = numberToBytesBE(d_adjusted ^ bytesToNumberBE(await taggedHash('BIP0340/aux', auxRand)), 32);
  const rand = await taggedHash('BIP0340/nonce', t, px, message);
  const k_ = mod(bytesToNumberBE(rand), CURVE.n);
  if (k_ === _0n) throw new Error('Invalid k');
  
  const R = mul(k_);
  const k = R.y % _2n === _0n ? k_ : CURVE.n - k_;
  const rx = numberToBytesBE(R.x, 32);
  
  const e = mod(bytesToNumberBE(await taggedHash('BIP0340/challenge', rx, px, message)), CURVE.n);
  
  // Verwende concatBytes statt .concat()
  const sigBytes = concatBytes(rx, numberToBytesBE(mod(k + e * d_adjusted, CURVE.n), 32));
  
  if (!(await schnorrVerify(sigBytes, message, px))) {
    throw new Error('Invalid signature produced');
  }
  
  return sigBytes;
}

async function schnorrVerify(signature, message, publicKey) {
  try {
    if (typeof signature === 'string') signature = hexToBytes(signature);
    if (typeof message === 'string') message = hexToBytes(message);
    if (typeof publicKey === 'string') publicKey = hexToBytes(publicKey);
    
    if (signature.length !== 64) return false;
    if (message.length !== 32) return false;
    if (publicKey.length !== 32) return false;
    
    const r = bytesToNumberBE(signature.slice(0, 32));
    const s = bytesToNumberBE(signature.slice(32, 64));
    
    if (r >= CURVE.P || s >= CURVE.n) return false;
    
    const e = mod(bytesToNumberBE(await taggedHash('BIP0340/challenge', signature.slice(0, 32), publicKey, message)), CURVE.n);
    const P = lift_x(bytesToNumberBE(publicKey));
    
    const sG = mul(s);
    const eP = mul(e);
    const ePneg = { x: eP.x, y: mod(-eP.y) };
    const R = pointAdd(sG, pointAdd(ePneg, { x: P.x, y: P.y }));
    
    if (R === null) return false;
    if (R.y % _2n !== _0n) return false;
    if (R.x !== r) return false;
    
    return true;
  } catch (e) {
    return false;
  }
}

export const schnorr = {
  getPublicKey: (privKey) => {
    const point = mul(normalizePrivateKey(privKey));
    return numberToBytesBE(point.x, 32);
  },
  sign: schnorrSign,
  verify: schnorrVerify,
};

export { getPublicKey };