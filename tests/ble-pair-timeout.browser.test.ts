// A pairing nobody confirms must end, or the rescue page's retry loop stops on it for good.
import { expect, test } from "vitest";
import { Watch } from "$lib/modules/device/lib/ble";
import { UUID } from "$lib/modules/device/lib/ble-protocol";

const silent = () => {
  const w = new Watch();

  w.chars[UUID.shellWrite] = {
    writeValue: async () => {},
  } as unknown as BluetoothRemoteGATTCharacteristic;
  return w;
};

test("pairing gives up after its timeout", async () => {
  await expect(silent().pair(20)).rejects.toThrow(/timeout waiting for the pairing confirmation/);
});

test("pairing ends when the watch drops the link", async () => {
  const w = silent();

  w.device = new EventTarget() as unknown as BluetoothDevice;
  const pairing = w.pair();

  await new Promise((r) => setTimeout(r, 20));
  w.device.dispatchEvent(new Event("gattserverdisconnected"));
  await expect(pairing).rejects.toThrow(/disconnected before the pairing/);
});
