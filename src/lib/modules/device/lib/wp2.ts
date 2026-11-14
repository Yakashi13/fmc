// What the App Loader firmware (cmf-tech-community/wp2-apps) keeps on the watch, as its stub reports
// it: the stub's own release and the package in each slot. Read-only — installing is not here.
//
// The stub answers INFO (0x90A0) on the stock command channel, under the session this app already
// holds. Stock firmware passes commands it doesn't know to a default branch that ignores them —
// the branch the stub hooks — so a stock watch simply doesn't answer.

/** Package slots 0–7 hold apps; L (0xFF) the loader. */
export const APP_SLOTS = 8;
export const LOADER_SLOT = 0xff;
/** INFO for this slot answers the stub's release instead of a header (stub 2+). */
export const STUB_SLOT = 0xfe;

export const STATUS_OK = 0;
export const STATUS_BAD_REQUEST = 1;

export interface Wp2Stub {
  /** 1 for every stub from before the release was readable. */
  version: number;
  /** The highest package abi_minor it takes; unknown on stub 1. */
  abiMinor: number | null;
}

export interface Wp2Package {
  name: string;
  version: number;
  /** 0 app, 1 loader */
  kind: number;
  abiMinor: number;
  size: number;
  /** CRC32 of image ‖ relocation table — the same build has the same one, on the watch and off. */
  crc: number;
}

export interface Wp2State {
  stub: Wp2Stub;
  loader: Wp2Package | null;
  /** slot → package, apps only */
  apps: Record<number, Wp2Package>;
}

export const HEADER_SIZE = 64;

// <4sHBB24sIIIIII8s: magic, abi, kind, abi_minor, name, version, size, entry, relocs, crc, header crc, reserved
export function parsePackageHeader(h: Uint8Array): Wp2Package | null {
  if (h.length < HEADER_SIZE || new TextDecoder().decode(h.subarray(0, 4)) !== "WP2A") return null;
  const dv = new DataView(h.buffer, h.byteOffset, HEADER_SIZE);
  const raw = h.subarray(8, 32);
  const nul = raw.indexOf(0);

  return {
    name: new TextDecoder().decode(nul < 0 ? raw : raw.subarray(0, nul)),
    version: dv.getUint32(32, true),
    kind: h[6],
    abiMinor: h[7],
    size: dv.getUint32(36, true),
    crc: dv.getUint32(48, true),
  };
}

export function parseStubReply(r: Uint8Array): Wp2Stub {
  // an older stub reads 0xFE as a bad slot
  if (r[0] === STATUS_BAD_REQUEST) return { version: 1, abiMinor: null };
  if (r.length !== 6 || r[0] !== STATUS_OK) throw new Error("unexpected stub reply");
  return { version: new DataView(r.buffer, r.byteOffset).getUint32(1, true), abiMinor: r[5] };
}

/** Is the catalog's build the one on the watch? Same name, same image. */
export const samePackage = (a: Wp2Package, b: Wp2Package) => a.name === b.name && a.crc === b.crc;
