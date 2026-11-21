// The watch ignores a factory reset until a time write marks the link live, and a clock more
// than 2 minutes off takes the time only on the second write (WP3 firmware, in the emulator).
import { expect, test } from "vitest";
import { Watch } from "$lib/modules/device/lib/ble";
import { CMD, MARKER } from "$lib/modules/device/lib/ble-protocol";

test("factory reset goes out after two time writes in the reference format", async () => {
  const w = new Watch();
  const sent: [number, Uint8Array][] = [];

  w.send = async (key: number, payload?: Uint8Array) => {
    sent.push([key, payload ?? new Uint8Array()]);
  };
  const before = Math.floor(Date.now() / 1000);

  await w.factoryReset();

  expect(sent.map(([k]) => k)).toEqual([CMD.time, CMD.time, CMD.factoryReset]);
  const dv = new DataView(sent[0][1].buffer);

  expect(sent[0][1].length).toBe(8);
  expect(dv.getInt32(0)).toBeGreaterThanOrEqual(before);
  // | 0: in UTC the offset is -0, which the int32 field reads back as 0
  expect(dv.getInt32(4)).toBe((-new Date().getTimezoneOffset() * 60000) | 0);
  expect([...sent[2][1]]).toEqual([MARKER]);
});
