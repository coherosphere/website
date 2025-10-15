/*! bech32 - MIT License (c) 2017 Pieter Wuille
 * Version: 2.0.0
 * Browser-compatible ES Module
 */

const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';
const GENERATOR = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];

function polymod(values) {
  let chk = 1;
  for (let p = 0; p < values.length; ++p) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ values[p];
    for (let i = 0; i < 5; ++i) {
      if ((top >> i) & 1) {
        chk ^= GENERATOR[i];
      }
    }
  }
  return chk;
}

function hrpExpand(hrp) {
  const ret = [];
  let p;
  for (p = 0; p < hrp.length; ++p) {
    ret.push(hrp.charCodeAt(p) >> 5);
  }
  ret.push(0);
  for (p = 0; p < hrp.length; ++p) {
    ret.push(hrp.charCodeAt(p) & 31);
  }
  return ret;
}

function verifyChecksum(hrp, data, encoding) {
  return polymod(hrpExpand(hrp).concat(data)) === encodingConst(encoding);
}

function createChecksum(hrp, data, encoding) {
  const values = hrpExpand(hrp).concat(data).concat([0, 0, 0, 0, 0, 0]);
  const mod = polymod(values) ^ encodingConst(encoding);
  const ret = [];
  for (let p = 0; p < 6; ++p) {
    ret.push((mod >> (5 * (5 - p))) & 31);
  }
  return ret;
}

function encode(hrp, data, encoding) {
  const combined = data.concat(createChecksum(hrp, data, encoding));
  let ret = hrp + '1';
  for (let p = 0; p < combined.length; ++p) {
    ret += CHARSET.charAt(combined[p]);
  }
  return ret;
}

function decode(bechString, encoding) {
  let p;
  let has_lower = false;
  let has_upper = false;
  for (p = 0; p < bechString.length; ++p) {
    if (bechString.charCodeAt(p) < 33 || bechString.charCodeAt(p) > 126) {
      return null;
    }
    if (bechString.charCodeAt(p) >= 97 && bechString.charCodeAt(p) <= 122) {
      has_lower = true;
    }
    if (bechString.charCodeAt(p) >= 65 && bechString.charCodeAt(p) <= 90) {
      has_upper = true;
    }
  }
  if (has_lower && has_upper) {
    return null;
  }
  bechString = bechString.toLowerCase();
  const pos = bechString.lastIndexOf('1');
  if (pos < 1 || pos + 7 > bechString.length || bechString.length > 90) {
    return null;
  }
  const hrp = bechString.substring(0, pos);
  const data = [];
  for (p = pos + 1; p < bechString.length; ++p) {
    const d = CHARSET.indexOf(bechString.charAt(p));
    if (d === -1) {
      return null;
    }
    data.push(d);
  }
  if (!verifyChecksum(hrp, data, encoding)) {
    return null;
  }
  return { hrp: hrp, data: data.slice(0, data.length - 6) };
}

function encodingConst(encoding) {
  if (encoding === 'bech32') {
    return 1;
  } else if (encoding === 'bech32m') {
    return 0x2bc830a3;
  } else {
    throw new Error('Unknown encoding');
  }
}

function convertbits(data, frombits, tobits, pad) {
  let acc = 0;
  let bits = 0;
  const ret = [];
  const maxv = (1 << tobits) - 1;
  for (let p = 0; p < data.length; ++p) {
    const value = data[p];
    if (value < 0 || value >> frombits !== 0) {
      return null;
    }
    acc = (acc << frombits) | value;
    bits += frombits;
    while (bits >= tobits) {
      bits -= tobits;
      ret.push((acc >> bits) & maxv);
    }
  }
  if (pad) {
    if (bits > 0) {
      ret.push((acc << (tobits - bits)) & maxv);
    }
  } else if (bits >= frombits || ((acc << (tobits - bits)) & maxv)) {
    return null;
  }
  return ret;
}

function toWords(bytes) {
  return convertbits(bytes, 8, 5, true);
}

function fromWords(words) {
  return convertbits(words, 5, 8, false);
}

export { decode, encode, toWords, fromWords };