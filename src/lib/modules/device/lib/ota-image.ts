// The AOTA firmware container the Watch Pro 2 (board JX402, Actions ATS3089C) takes over the air —
// read-only: this file decides whether an image may be offered to a watch at all. Port of the
// checks in cmf-watch-utils (emu/image.py `container`, fwkit/aota.py), verified against the
// vendor's 1.0.0.73 image.
//
//   0x000 "AOTA"
//   0x004 u32  crc32(file[0x08:0x400])            header CRC
//   0x00c u32  number of table entries, ota.xml included
//   0x012 u16  data start (0x400)
//   0x014 u32  data end = where the AGPS trailer starts
//   0x018 u32  crc32(file[start:end])             data CRC
//   0x040 version name, 0x060 board name (NUL-terminated ASCII)
//   0x200 entries, 32 B: name[16] | off u32 | size u32 | 0 u32 | crc32(stored bytes) u32
//   0x400 ota.xml, then the partitions, then the trailer: "AGPS", u64 at +8 = its length − 24
//
// The watch has no signature check, only these CRCs — so a file that passes here is a file the
// watch will try to install. Everything is little-endian.
import { crc32 } from "./ble-protocol";

/** The only board this code has ever been run against. */
export const OTA_BOARD = "jx402_01_3089c";

const HDR = 0x400;
const TABLE = 0x200;
const ENTRY = 32;
const MAX_ENTRIES = (HDR - TABLE) / ENTRY;

export interface OtaPartition {
  name: string;
  offset: number;
  size: number;
}
export interface OtaImage {
  board: string;
  /** The header's build string, e.g. "1.00_2509131556". */
  version: string;
  /** `version_code` from ota.xml — the number the watch compares against its own. */
  versionCode: number | null;
  /** Everything but ota.xml, in file order. */
  partitions: OtaPartition[];
  size: number;
}

const ascii = (d: Uint8Array, off: number, len: number) => {
  const end = d.indexOf(0, off);

  return new TextDecoder("ascii").decode(
    d.subarray(off, end < 0 || end > off + len ? off + len : end),
  );
};
const need = (ok: boolean, why: string) => {
  if (!ok) throw new Error(`not a flashable image: ${why}`);
};

/** Parse and verify an image; throws with the reason when the watch shouldn't be offered it. */
export function inspectOtaImage(d: Uint8Array): OtaImage {
  need(d.length >= HDR, "too small");
  const dv = new DataView(d.buffer, d.byteOffset, d.byteLength);

  need(ascii(d, 0, 4) === "AOTA", "no AOTA magic");
  need(crc32(d.subarray(8, HDR)) === dv.getUint32(4, true), "header checksum");
  const count = dv.getUint32(0x0c, true);

  need(count >= 1 && count <= MAX_ENTRIES, `entry count ${count}`);
  const start = dv.getUint16(0x12, true),
    end = dv.getUint32(0x14, true);

  need(start >= HDR && start <= end && end <= d.length, "data bounds");
  // tools that repack an image without fixing this field exist (fwkit pack); the stock
  // firmware in the emulator rejects their output, and whether a real watch does is unknown —
  // so don't find out with someone's watch
  need(crc32(d.subarray(start, end)) === dv.getUint32(0x18, true), "data checksum");
  const board = ascii(d, 0x60, 28);

  need(board === OTA_BOARD, `built for board "${board}", not ${OTA_BOARD}`);

  const entries = Array.from({ length: count }, (_, i) => {
    const o = TABLE + i * ENTRY;

    return {
      name: ascii(d, o, 16),
      offset: dv.getUint32(o + 16, true),
      size: dv.getUint32(o + 20, true),
      flags: dv.getUint32(o + 24, true),
      crc: dv.getUint32(o + 28, true),
    };
  });
  const seen = new Set<string>();
  let prev = start;

  for (const e of [...entries].sort((a, b) => a.offset - b.offset)) {
    need(
      Boolean(e.name) &&
        !seen.has(e.name) &&
        e.flags === 0 &&
        e.size > 0 &&
        e.offset >= prev &&
        e.offset + e.size <= end,
      `entry "${e.name}" out of place`,
    );
    need(crc32(d.subarray(e.offset, e.offset + e.size)) === e.crc, `checksum of ${e.name}`);
    seen.add(e.name);
    prev = e.offset + e.size;
  }

  const xmlEntry = entries.find((e) => e.name === "ota.xml");

  need(Boolean(xmlEntry) && xmlEntry!.size <= 65536, "no ota.xml");
  const xml = new TextDecoder().decode(
    d.subarray(xmlEntry!.offset, xmlEntry!.offset + xmlEntry!.size),
  );
  // ponytail: a manifest this regular doesn't need an XML parser (and DOMParser would tie this
  // file to a browser) — a tag is read by name, and a file whose manifest disagrees with its
  // own table is refused below
  const tag = (name: string, from = xml) =>
    from.match(new RegExp(`<${name}>\\s*([^<]*?)\\s*</${name}>`))?.[1];

  need(tag("board_name") === OTA_BOARD, "ota.xml names another board");
  const declared = [...xml.matchAll(/<partition>([\s\S]*?)<\/partition>/g)].map((m) => ({
    name: tag("file_name", m[1]) ?? "",
    size: Number(tag("file_size", m[1])),
  }));
  const partitions = entries.filter((e) => e.name !== "ota.xml");

  need(
    declared.length === partitions.length &&
      partitions.every((p) => declared.some((x) => x.name === p.name && x.size === p.size)),
    "ota.xml doesn't match the file table",
  );
  need(seen.has("TEMP.bin"), "no TEMP.bin — nothing for the watch to install");

  // the stock receiver asks for the AGPS record too: an image without the trailer (the
  // emulator-only "temp-only" form) stalls a real watch mid-transfer
  const trailer = d.subarray(end);

  need(
    trailer.length > 24 &&
      ascii(trailer, 0, 4) === "AGPS" &&
      Number(new DataView(trailer.buffer, trailer.byteOffset).getBigUint64(8, true)) ===
        trailer.length - 24,
    "no AGPS trailer (an emulator-only image?)",
  );

  const code = Number(tag("version_code"));

  return {
    board,
    version: ascii(d, 0x40, 32),
    versionCode: Number.isFinite(code) ? code : null,
    partitions: partitions.map(({ name, offset, size }) => ({ name, offset, size })),
    size: d.length,
  };
}
