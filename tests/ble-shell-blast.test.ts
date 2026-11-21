// shellBlast streams its command at the shell, then counts the watch alive only if the shell
// answers: a Watch 3 Pro past its fault keeps the link for seconds and answers nothing.
import { expect, test, vi } from "vitest";
import { Watch } from "$lib/modules/device/lib/ble";
import { UUID } from "$lib/modules/device/lib/ble-protocol";

const fakeWatch = (name: string, answers: boolean) => {
  const lines: string[] = [];
  const read = Object.assign(new EventTarget(), {
    uuid: UUID.shellRead,
    value: undefined as DataView | undefined,
    startNotifications: async () => read,
  });
  const write = {
    uuid: UUID.shellWrite,
    properties: { writeWithoutResponse: true },
    writeValueWithoutResponse: async (v: Uint8Array) => {
      const line = new TextDecoder().decode(v).trim();

      lines.push(line);
      if (answers && line === "AT GETVERSION")
        setTimeout(() => {
          read.value = new DataView(new TextEncoder().encode("GETVERSION:1.0.1.77,OK").buffer);
          read.dispatchEvent(new Event("characteristicvaluechanged"));
        });
    },
  };
  const service = { uuid: "fff0", getCharacteristics: async () => [write, read] };
  const gatt = {
    connected: false,
    connect: async () => ((gatt.connected = true), { getPrimaryServices: async () => [service] }),
    disconnect: vi.fn(() => (gatt.connected = false)),
  };

  return { device: { name, gatt }, lines };
};
const blast = (name: string, answers: boolean) => {
  const fake = fakeWatch(name, answers);
  const w = new Watch();

  w.device = fake.device as unknown as BluetoothDevice;
  return { run: () => w.shellBlast("dbg mwb 0x3800f73a 0", true), fake };
};

test("a watch that answers the shell after the stream is a way out", async () => {
  const { run, fake } = blast("CMF Watch 3 Pro-4DA4", true);

  expect(await run()).toBe(true);
  expect(fake.lines.filter((l) => l === "dbg mwb 0x3800f73a 0").length).toBeGreaterThan(10);
  expect(fake.lines.at(-1)).toBe("AT GETVERSION");
});

test("a silent watch is a miss, and the link is let go for the next boot", async () => {
  const { run, fake } = blast("CMF Watch 3 Pro-4DA4", false);

  expect(await run()).toBe(false);
  expect(fake.device.gatt.disconnect).toHaveBeenCalled();
});

test("another model is refused before anything goes out", async () => {
  const { run, fake } = blast("CMF Watch Pro 2-1A2B", true);

  await expect(run()).rejects.toThrow(/Watch 3 Pro/);
  expect(fake.lines).toEqual([]);
});
