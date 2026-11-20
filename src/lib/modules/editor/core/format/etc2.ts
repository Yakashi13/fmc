// ETC2 RGBA8 (EAC alpha + ETC2 RGB) block texture — what cf 28 resources on the CMF Watch Pro 3
// are stored as: 4x4-pixel blocks of 16 bytes (8 alpha, 8 colour), row-major over the image
// padded to a multiple of 4 on both axes. Spec: OpenGL ES 3.0, appendix C.
// The encoder exists because the Watch 3 Pro holds every image of a screen decoded in RAM, and
// cf 28 is the one format it keeps at 1 byte per pixel (see fitForWatch).

const MOD = [
  [2, 8],
  [5, 17],
  [9, 29],
  [13, 42],
  [18, 60],
  [24, 80],
  [33, 106],
  [47, 183],
];
const DIST = [3, 6, 11, 16, 23, 32, 41, 64];
const EAC = [
  [-3, -6, -9, -15, 2, 5, 8, 14],
  [-3, -7, -10, -13, 2, 6, 9, 12],
  [-2, -5, -8, -13, 1, 4, 7, 12],
  [-2, -4, -6, -13, 1, 3, 5, 12],
  [-3, -6, -8, -12, 2, 5, 7, 11],
  [-3, -7, -9, -11, 2, 6, 8, 10],
  [-4, -7, -8, -11, 3, 6, 7, 10],
  [-3, -5, -8, -11, 2, 4, 7, 10],
  [-2, -6, -8, -10, 1, 5, 7, 9],
  [-2, -5, -8, -10, 1, 4, 7, 9],
  [-2, -4, -8, -10, 1, 3, 7, 9],
  [-2, -5, -7, -10, 1, 4, 6, 9],
  [-3, -4, -7, -10, 2, 3, 6, 9],
  [-1, -2, -3, -10, 0, 1, 2, 9],
  [-4, -6, -8, -9, 3, 5, 7, 8],
  [-3, -5, -7, -9, 2, 4, 6, 8],
];

const clamp = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);
const ext4 = (v: number) => v * 17;
const ext5 = (v: number) => (v << 3) | (v >> 2);
const ext6 = (v: number) => (v << 2) | (v >> 4);
const ext7 = (v: number) => (v << 1) | (v >> 6);
const s3 = (v: number) => (v & 7) - (v & 4 ? 8 : 0); // 3-bit two's complement

/** Decode the 8-byte colour block at `b[o..]` into `out` as 16 RGB triples, pixel i = x*4+y. */
function rgbBlock(b: Uint8Array, o: number, out: Uint8ClampedArray) {
  const b0 = b[o],
    b1 = b[o + 1],
    b2 = b[o + 2],
    b3 = b[o + 3];
  const lo = ((b[o + 4] << 24) | (b[o + 5] << 16) | (b[o + 6] << 8) | b[o + 7]) >>> 0;
  const idx = (i: number) => (((lo >>> (16 + i)) & 1) << 1) | ((lo >>> i) & 1);
  const paint = (p: number[][]) => {
    for (let i = 0; i < 16; i++) {
      const c = p[idx(i)];

      out[i * 3] = c[0];
      out[i * 3 + 1] = c[1];
      out[i * 3 + 2] = c[2];
    }
  };
  const diff = (b3 >> 1) & 1;
  let c1: number[], c2: number[];

  if (!diff) {
    c1 = [ext4(b0 >> 4), ext4(b1 >> 4), ext4(b2 >> 4)];
    c2 = [ext4(b0 & 15), ext4(b1 & 15), ext4(b2 & 15)];
  } else {
    const R = b0 >> 3,
      G = b1 >> 3,
      B = b2 >> 3;
    const R2 = R + s3(b0),
      G2 = G + s3(b1),
      B2 = B + s3(b2);

    if (R2 < 0 || R2 > 31) {
      // T mode: one base colour plus a second with ±distance
      const c0 = [ext4((((b0 >> 3) & 3) << 2) | (b0 & 3)), ext4(b1 >> 4), ext4(b1 & 15)];
      const cA = [ext4(b2 >> 4), ext4(b2 & 15), ext4(b3 >> 4)];
      const d = DIST[(((b3 >> 2) & 3) << 1) | (b3 & 1)];

      return paint([c0, cA.map((v) => clamp(v + d)), cA, cA.map((v) => clamp(v - d))]);
    }
    if (G2 < 0 || G2 > 31) {
      // H mode: two base colours, each ±distance
      const cA = [
        ext4((b0 >> 3) & 15),
        ext4(((b0 & 7) << 1) | ((b1 >> 4) & 1)),
        ext4((((b1 >> 3) & 1) << 3) | ((b1 & 3) << 1) | (b2 >> 7)),
      ];
      const cB = [ext4((b2 >> 3) & 15), ext4(((b2 & 7) << 1) | (b3 >> 7)), ext4((b3 >> 3) & 15)];
      const vA = (cA[0] << 16) | (cA[1] << 8) | cA[2],
        vB = (cB[0] << 16) | (cB[1] << 8) | cB[2];
      const d = DIST[(((b3 >> 2) & 1) << 2) | ((b3 & 1) << 1) | (vA >= vB ? 1 : 0)];

      return paint([
        cA.map((v) => clamp(v + d)),
        cA.map((v) => clamp(v - d)),
        cB.map((v) => clamp(v + d)),
        cB.map((v) => clamp(v - d)),
      ]);
    }
    if (B2 < 0 || B2 > 31) {
      // planar: a colour gradient from three corner colours O (0,0), H (4,0), V (0,4)
      const b4 = b[o + 4],
        b5 = b[o + 5],
        b6 = b[o + 6],
        b7 = b[o + 7];
      const O = [
        ext6((b0 >> 1) & 63),
        ext7(((b0 & 1) << 6) | ((b1 >> 1) & 63)),
        ext6(((b1 & 1) << 5) | (b2 & 0x18) | ((b2 & 3) << 1) | (b3 >> 7)),
      ];
      const H = [
        ext6((((b3 >> 2) & 31) << 1) | (b3 & 1)),
        ext7(b4 >> 1),
        ext6(((b4 & 1) << 5) | (b5 >> 3)),
      ];
      const V = [
        ext6(((b5 & 7) << 3) | (b6 >> 5)),
        ext7(((b6 & 31) << 2) | (b7 >> 6)),
        ext6(b7 & 63),
      ];

      for (let x = 0; x < 4; x++)
        for (let y = 0; y < 4; y++)
          for (let k = 0; k < 3; k++)
            out[(x * 4 + y) * 3 + k] = clamp(
              (x * (H[k] - O[k]) + y * (V[k] - O[k]) + 4 * O[k] + 2) >> 2,
            );
      return;
    }
    c1 = [ext5(R), ext5(G), ext5(B)];
    c2 = [ext5(R2), ext5(G2), ext5(B2)];
  }
  // ETC1: two sub-blocks (left/right, or top/bottom when flipped), each a base ± table modifier
  const flip = b3 & 1;
  const t1 = MOD[b3 >> 5],
    t2 = MOD[(b3 >> 2) & 7];

  for (let i = 0; i < 16; i++) {
    const x = i >> 2,
      y = i & 3;
    const first = flip ? y < 2 : x < 2;
    const base = first ? c1 : c2,
      t = first ? t1 : t2;
    const k = idx(i);
    const m = (k & 1 ? t[1] : t[0]) * (k & 2 ? -1 : 1);

    out[i * 3] = clamp(base[0] + m);
    out[i * 3 + 1] = clamp(base[1] + m);
    out[i * 3 + 2] = clamp(base[2] + m);
  }
}

/** Padded buffer size of a w×h ETC2 RGBA8 texture. */
export const etc2Size = (w: number, h: number) => ((w + 3) >> 2) * ((h + 3) >> 2) * 16;

/** ETC2 RGBA8 blocks -> RGBA pixels, cropped to w×h. */
export function decodeEtc2(raw: Uint8Array, w: number, h: number): Uint8ClampedArray<ArrayBuffer> {
  const px = new Uint8ClampedArray(w * h * 4);
  const bw = (w + 3) >> 2;
  const rgb = new Uint8ClampedArray(48);

  for (let o = 0, blk = 0; o + 16 <= raw.length; o += 16, blk++) {
    const bx = (blk % bw) * 4,
      by = ((blk / bw) | 0) * 4;
    const base = raw[o],
      mult = raw[o + 1] >> 4,
      tbl = EAC[raw[o + 1] & 15];
    // 48 bits of 3-bit alpha indices, first pixel in the top bits
    const aHi = (raw[o + 2] << 16) | (raw[o + 3] << 8) | raw[o + 4];
    const aLo = (raw[o + 5] << 16) | (raw[o + 6] << 8) | raw[o + 7];

    rgbBlock(raw, o + 8, rgb);
    for (let i = 0; i < 16; i++) {
      const x = bx + (i >> 2),
        y = by + (i & 3);

      if (x >= w || y >= h) continue;
      const ai = i < 8 ? (aHi >> (21 - 3 * i)) & 7 : (aLo >> (45 - 3 * i)) & 7;
      const p = (y * w + x) * 4;

      px[p] = rgb[i * 3];
      px[p + 1] = rgb[i * 3 + 1];
      px[p + 2] = rgb[i * 3 + 2];
      px[p + 3] = clamp(base + tbl[ai] * mult);
    }
  }
  return px;
}

// ---- encoder ----
// ponytail: ETC1-compatible individual/differential blocks only (no T, H or planar) and a
// per-subblock average as the base colour, no refinement. Good enough for watch-face art and
// fast in a browser; a smooth gradient bands a little more than a real encoder's output would.

const sq = (v: number) => v * v;

/** Best modifier index and its error for one channel triple against base ± table entry. */
function bestIdx(r: number, g: number, b: number, base: number[], t: number[]): [number, number] {
  let best = 0,
    err = Infinity;

  for (let k = 0; k < 4; k++) {
    const m = (k & 1 ? t[1] : t[0]) * (k & 2 ? -1 : 1);
    const e = sq(clamp(base[0] + m) - r) + sq(clamp(base[1] + m) - g) + sq(clamp(base[2] + m) - b);

    if (e < err) [best, err] = [k, e];
  }
  return [best, err];
}

/** One 8-byte colour block from 16 RGBA pixels in block order (i = x*4+y). */
function encodeRgbBlock(px: Uint8Array, out: Uint8Array, o: number) {
  let bestErr = Infinity;

  for (let flip = 0; flip < 2; flip++) {
    const inFirst = (i: number) => (flip ? (i & 3) < 2 : i >> 2 < 2);
    const avg = [0, 1].map((half) => {
      const s = [0, 0, 0];

      for (let i = 0; i < 16; i++)
        if (inFirst(i) === !half) for (let k = 0; k < 3; k++) s[k] += px[i * 4 + k];
      return s.map((v) => v / 8);
    });
    const q5 = avg.map((c) => c.map((v) => Math.round((v * 31) / 255)));
    const d = q5[1].map((v, k) => v - q5[0][k]);
    const diff = d.every((v) => v >= -4 && v <= 3);
    const q = diff ? q5 : avg.map((c) => c.map((v) => Math.round((v * 15) / 255)));
    const bases = q.map((c) => c.map(diff ? ext5 : ext4));
    const tables = [0, 0],
      idx = new Uint8Array(16);
    let total = 0;

    for (let half = 0; half < 2; half++) {
      let tErr = Infinity;

      for (let t = 0; t < 8; t++) {
        let e = 0;
        const ks: [number, number][] = [];

        for (let i = 0; i < 16; i++) {
          if (inFirst(i) !== !half) continue;
          const r = bestIdx(px[i * 4], px[i * 4 + 1], px[i * 4 + 2], bases[half], MOD[t]);

          ks.push([i, r[0]]);
          e += r[1];
        }
        if (e < tErr) {
          tErr = e;
          tables[half] = t;
          for (const [i, k] of ks) idx[i] = k;
        }
      }
      total += tErr;
    }
    if (total >= bestErr) continue;
    bestErr = total;
    const [a, b] = q;

    if (diff) for (let k = 0; k < 3; k++) out[o + k] = (a[k] << 3) | (d[k] & 7);
    else for (let k = 0; k < 3; k++) out[o + k] = (a[k] << 4) | b[k];
    out[o + 3] = (tables[0] << 5) | (tables[1] << 2) | ((diff ? 1 : 0) << 1) | flip;
    let lo = 0;

    for (let i = 0; i < 16; i++) lo |= ((idx[i] >> 1) << (16 + i)) | ((idx[i] & 1) << i);
    out[o + 4] = lo >>> 24;
    out[o + 5] = lo >>> 16;
    out[o + 6] = lo >>> 8;
    out[o + 7] = lo;
  }
}

/** One 8-byte EAC alpha block from the alpha bytes of 16 pixels in block order. */
function encodeAlphaBlock(px: Uint8Array, out: Uint8Array, o: number) {
  let lo = 255,
    hi = 0;

  for (let i = 0; i < 16; i++) {
    lo = Math.min(lo, px[i * 4 + 3]);
    hi = Math.max(hi, px[i * 4 + 3]);
  }
  // table 13 holds a 0 modifier at index 4: a flat block is exact
  let best = {
    err: lo === hi ? 0 : Infinity,
    base: lo,
    mult: 1,
    t: 13,
    idx: new Uint8Array(16).fill(4),
  };

  for (let t = 0; t < 16 && best.err > 0; t++) {
    const tb = EAC[t],
      tMin = Math.min(...tb),
      tMax = Math.max(...tb);

    for (let mult = 1; mult < 16; mult++) {
      const base = clamp(Math.round((lo + hi) / 2 - ((tMin + tMax) / 2) * mult));
      const idx = new Uint8Array(16);
      let err = 0;

      for (let i = 0; i < 16 && err < best.err; i++) {
        const a = px[i * 4 + 3];
        let e = Infinity;

        for (let k = 0; k < 8; k++) {
          const v = sq(clamp(base + tb[k] * mult) - a);

          if (v < e) [e, idx[i]] = [v, k];
        }
        err += e;
      }
      if (err < best.err) best = { err, base, mult, t, idx };
    }
  }
  out[o] = best.base;
  out[o + 1] = (best.mult << 4) | best.t;
  let h = 0,
    l = 0;

  for (let i = 0; i < 8; i++) h |= best.idx[i] << (21 - 3 * i);
  for (let i = 8; i < 16; i++) l |= best.idx[i] << (45 - 3 * i);
  out.set(
    [h >> 16, h >> 8, h, l >> 16, l >> 8, l].map((v) => v & 255),
    o + 2,
  );
}

/** RGBA pixels -> ETC2 RGBA8 blocks, edge blocks padded by repeating the last row/column. */
export function encodeEtc2(rgba: Uint8ClampedArray | Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(etc2Size(w, h));
  const bw = (w + 3) >> 2;
  const blk = new Uint8Array(64);

  for (let o = 0, n = 0; o < out.length; o += 16, n++) {
    const bx = (n % bw) * 4,
      by = ((n / bw) | 0) * 4;

    for (let i = 0; i < 16; i++) {
      const x = Math.min(bx + (i >> 2), w - 1),
        y = Math.min(by + (i & 3), h - 1);

      blk.set(rgba.subarray((y * w + x) * 4, (y * w + x) * 4 + 4), i * 4);
    }
    encodeAlphaBlock(blk, out, o);
    encodeRgbBlock(blk, out, o + 8);
  }
  return out;
}
