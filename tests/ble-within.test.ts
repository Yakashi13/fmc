// Rescue gives each notification subscription a few seconds: a step the watch never answers must
// end, and one it answers must not leave a late rejection behind.
import { expect, test } from "vitest";
import { within } from "$lib/modules/device/lib/ble";

test("within rejects a promise that doesn't settle in time", async () => {
  await expect(within(new Promise(() => {}), 10, () => new Error("late"))).rejects.toThrow("late");
});

test("within passes a prompt answer through", async () => {
  await expect(within(Promise.resolve(7), 10, () => new Error("late"))).resolves.toBe(7);
});
