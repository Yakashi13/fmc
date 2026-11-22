import { test, expect } from "vitest";
import {
  advertisementIdentity,
  identity,
  observeIdentity,
  productReply,
} from "$lib/modules/device/lib/watch-identity";
const data = (hex: string) =>
  new DataView(Uint8Array.from(hex.match(/../g)!.map((v) => parseInt(v, 16))).buffer);

test("Nothing X legacy and compact watch layouts decode model and color without retaining MAC", () => {
  const first = advertisementIdentity(0x0ccb, data("AABBCCDDEEFF4A582D49574434F728511300"));

  expect(first).toMatchObject({
    model: "watch_pro_2",
    productId: "34F72851",
    colorId: "13",
    color: "orange",
  });
  expect(Object.keys(first!)).not.toContain("mac");
  expect(advertisementIdentity(0xbe2c, data("CCDDEEFF4A58335BBD622300"))).toMatchObject({
    model: "watch_3_pro",
    color: "orange",
  });
  expect(advertisementIdentity(0x0ccb, data("AABBCCDDEEFF4A5882D5BB720500"))).toMatchObject({
    model: "watch_pro",
    color: "orange",
  });
});
test("unknown, malformed and truncated identities never invent colors", () => {
  expect(advertisementIdentity(0x1234, data("AABBCCDDEEFF4A58335BBD622300"))).toBeNull();
  expect(advertisementIdentity(0x0ccb, data("AABBCCDDEEFF4A58335BBD62"))).toBeNull();
  expect(identity("335bbd62", "ff", "advertisement").color).toBeNull();
  expect(productReply("GETPID:335bbd62,OK")).toMatchObject({ model: "watch_3_pro", color: null });
  expect(productReply("GETPID:335bbd62,FAIL")).toBeNull();
  expect(productReply("GETPID:335bbd62")).toBeNull();
});
test("advertisement watching is optional and failures do not reject connection setup", async () => {
  await expect(observeIdentity(new EventTarget() as BluetoothDevice)).resolves.toBeNull();
  const device = Object.assign(new EventTarget(), {
    watchAdvertisements: async () => {
      throw Error("unavailable");
    },
  }) as unknown as BluetoothDevice;

  await expect(observeIdentity(device)).resolves.toBeNull();
});
