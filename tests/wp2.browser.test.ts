// What the App Loader stub reports about the watch (wp2.ts, Watch.readWp2): the three answers to
// "which stub?" — none (stock), an old one, a versioned one — and the slot headers that decide
// "installed" against "update available".
import { expect, test } from "vitest";
import { Watch } from "$lib/modules/device/lib/ble";
import { CMD } from "$lib/modules/device/lib/ble-protocol";
import {
  LOADER_SLOT,
  parsePackageHeader,
  parseStubReply,
  samePackage,
  STUB_SLOT,
} from "$lib/modules/device/lib/wp2";

// a .wp2app header as wp2apps `pack` writes it (<4sHBB24sIIIIII8s)
function header(name: string, version: number, crc: number, kind = 0) {
  const h = new Uint8Array(64);
  const dv = new DataView(h.buffer);

  h.set(new TextEncoder().encode("WP2A"));
  dv.setUint16(4, 1, true);
  h[6] = kind;
  h[7] = 3;
  h.set(new TextEncoder().encode(name), 8);
  dv.setUint32(32, version, true);
  dv.setUint32(36, 1234, true);
  dv.setUint32(48, crc, true);
  return h;
}

test("a package header reads back name, version, kind and image CRC", () => {
  expect(parsePackageHeader(header("workout", 2, 0xacdf64f7))).toEqual({
    name: "workout",
    version: 2,
    kind: 0,
    abiMinor: 3,
    size: 1234,
    crc: 0xacdf64f7,
  });
  expect(parsePackageHeader(new Uint8Array(64))).toBeNull();
});

test("the stub's reply: versioned, and an older stub's BadRequest", () => {
  expect(parseStubReply(new Uint8Array([0, 2, 0, 0, 0, 3]))).toEqual({ version: 2, abiMinor: 3 });
  expect(parseStubReply(new Uint8Array([1]))).toEqual({ version: 1, abiMinor: null });
  expect(() => parseStubReply(new Uint8Array([0, 1]))).toThrow();
});

test("same build means same name and same CRC", () => {
  const a = parsePackageHeader(header("workout", 1, 7))!;

  expect(samePackage(a, parsePackageHeader(header("workout", 1, 7))!)).toBe(true);
  // a rebuild under the same version number is still a different build
  expect(samePackage(a, parsePackageHeader(header("workout", 1, 8))!)).toBe(false);
});

// a watch whose INFO answers come from a table; `null` is silence
function watchAnswering(answer: (slot: number) => Uint8Array | null) {
  const w = new Watch();
  const asked: number[] = [];
  let last = 0;

  w.send = async (key, payload) => {
    expect(key).toBe(CMD.stubInfo); // INFO and nothing else goes out
    last = payload![0];
    asked.push(last);
  };
  w.waitFor = async () => {
    const r = answer(last);

    if (!r) throw new Error("timeout");
    return r;
  };
  return { w, asked };
}

test("a stock watch doesn't answer: no stub, and nothing more is asked", async () => {
  const { w, asked } = watchAnswering(() => null);

  expect(await w.readWp2()).toBeNull();
  expect(asked).toEqual([STUB_SLOT]);
});

test("a watch with the stub reports its release, the loader and the apps by slot", async () => {
  const { w, asked } = watchAnswering((slot) => {
    if (slot === STUB_SLOT) return new Uint8Array([0, 2, 0, 0, 0, 3]);
    if (slot === LOADER_SLOT) return new Uint8Array([0, ...header("loader", 1, 9, 1)]);
    if (slot === 3) return new Uint8Array([0, ...header("workout", 2, 7)]);
    return new Uint8Array([0]); // an empty slot: status only
  });
  const state = await w.readWp2();

  expect(state?.stub).toEqual({ version: 2, abiMinor: 3 });
  expect(state?.loader?.name).toBe("loader");
  expect(Object.keys(state!.apps)).toEqual(["3"]);
  expect(state!.apps[3].name).toBe("workout");
  expect(asked).toEqual([STUB_SLOT, LOADER_SLOT, 0, 1, 2, 3, 4, 5, 6, 7]);
});
