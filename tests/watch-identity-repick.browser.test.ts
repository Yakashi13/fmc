import { expect, test, vi } from "vitest";
import { Watch, capacityOf } from "$lib/modules/device/lib/ble";
import { UUID } from "$lib/modules/device/lib/ble-protocol";

test("re-picking uses the new device name, capacity and advertised identity", async () => {
  localStorage.removeItem("fmc_authkey");
  const reads = [UUID.cmdRead, UUID.dataRead, UUID.shellRead].map((uuid) => {
    const characteristic = Object.assign(new EventTarget(), {
      uuid,
      properties: {},
      value: undefined as DataView | undefined,
      startNotifications: async () => characteristic,
    });

    return characteristic;
  });
  const write = {
    uuid: UUID.shellWrite,
    writeValue: async () => {
      const read = reads[2];

      read.value = new DataView(new TextEncoder().encode("GETPID:335BBD62,OK").buffer);
      read.dispatchEvent(new Event("characteristicvaluechanged"));
    },
  };
  const makeDevice = (name: string, hex: string, fails: boolean) => {
    const device = Object.assign(new EventTarget(), {
      name,
      gatt: {
        disconnect: vi.fn(),
        connect: async () => {
          if (fails) throw new Error("not offered to this origin");
          return {
            getPrimaryServices: async () => [{ getCharacteristics: async () => [...reads, write] }],
          };
        },
      },
      watchAdvertisements: async () => {
        queueMicrotask(() =>
          device.dispatchEvent(
            Object.assign(new Event("advertisementreceived"), {
              manufacturerData: new Map([
                [
                  0x0ccb,
                  new DataView(
                    Uint8Array.from(hex.match(/../g)!.map((v) => parseInt(v, 16))).buffer,
                  ),
                ],
              ]),
            }),
          ),
        );
      },
    });

    return device as unknown as BluetoothDevice;
  };
  const first = makeDevice("CMF Watch Pro 2", "0000000000004A5834F728511300", true);
  const second = makeDevice("CMF Watch 3 Pro", "0000000000004A58335BBD622500", false);
  const watch = new Watch(() => {});

  vi.spyOn(watch as unknown as { pick: () => Promise<BluetoothDevice> }, "pick")
    .mockResolvedValueOnce(first)
    .mockResolvedValueOnce(second);
  vi.spyOn(watch, "pair").mockResolvedValue(undefined);
  vi.spyOn(watch, "fetchInfo").mockResolvedValue(undefined);
  const info = await watch.connect();

  expect(watch.device).toBe(second);
  expect(watch.name).toBe(second.name);
  expect(watch.capacity).toBe(capacityOf(second.name ?? null));
  expect(info.identity).toMatchObject({
    model: "watch_3_pro",
    productId: "335BBD62",
    color: "green",
  });
});
