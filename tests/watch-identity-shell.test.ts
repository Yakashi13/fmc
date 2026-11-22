import { test, expect } from "vitest";
import { Watch } from "$lib/modules/device/lib/ble";
import { UUID } from "$lib/modules/device/lib/ble-protocol";
test("factory PID query is read-only and accepts fragmented notifications", async () => {
  const watch = new Watch(() => {});
  const commands: string[] = [];

  watch.chars[UUID.shellRead] = {} as BluetoothRemoteGATTCharacteristic;
  watch.chars[UUID.shellWrite] = {
    writeValue: async (data: BufferSource) => {
      commands.push(new TextDecoder().decode(data));
      await watch.onNotify(UUID.shellRead, new TextEncoder().encode("GETPID:335b"));
      await watch.onNotify(UUID.shellRead, new TextEncoder().encode("bd62,OK\r\n"));
    },
  } as unknown as BluetoothRemoteGATTCharacteristic;
  const result = await (
    watch as unknown as { readProductIdentity: () => Promise<unknown> }
  ).readProductIdentity();

  expect(result).toMatchObject({ productId: "335BBD62", model: "watch_3_pro", color: null });
  expect(commands).toEqual(["AT GETPID"]);
});
test("missing shell service leaves identification optional", async () => {
  const watch = new Watch(() => {});

  await expect(
    (watch as unknown as { readProductIdentity: () => Promise<unknown> }).readProductIdentity(),
  ).resolves.toBeNull();
});
