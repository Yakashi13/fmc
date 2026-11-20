// The rescue page keeps reconnecting to the picked watch until the factory reset goes out: a
// wedged watch is reachable only now and then. Drives the real rescue.model against a stub watch.
import { beforeEach, expect, test, vi } from "vitest";
import { rescueModel } from "$lib/modules/device/model";

const watch = vi.hoisted(() => ({
  fails: 0,
  connects: [] as boolean[],
  resets: 0,
  picker: false,
  deleted: [] as number[],
  installed: [] as number[],
}));

vi.mock("$lib/modules/device/lib/ble", async (importOriginal) => {
  class Watch {
    device = null;
    async connect({ again = false } = {}) {
      watch.connects.push(again);
      if (watch.picker) throw Object.assign(new Error("User cancelled"), { name: "NotFoundError" });
      if (watch.fails-- > 0) throw new Error("connection timed out");
      return { name: "CMF Watch 3 Pro-0000", battery: null, firmware: null, serial: null };
    }
    async factoryReset() {
      watch.resets++;
    }
    async deleteDial(id: number, filler: Uint8Array) {
      expect(filler.length).toBeGreaterThan(36);
      watch.deleted.push(id);
      return watch.installed.includes(id);
    }
  }

  return { ...(await importOriginal<object>()), Watch };
});

beforeEach(() =>
  Object.assign(watch, {
    fails: 0,
    connects: [],
    resets: 0,
    picker: false,
    deleted: [],
    installed: [],
  }),
);

test("a watch that drops twice gets the reset on the third try, picked only once", async () => {
  watch.fails = 2;
  rescueModel.resetRequested();
  await vi.waitFor(() => expect(rescueModel.$done.getState()).toEqual({ action: "reset" }), {
    timeout: 5000,
  });

  expect(watch.connects).toEqual([false, true, true]);
  expect(watch.resets).toBe(1);
  expect(rescueModel.$error.getState()).toBeNull();
});

test("stop ends the retries without an error or a reset", async () => {
  watch.fails = 1000;
  rescueModel.resetRequested();
  await vi.waitFor(() => expect(watch.connects.length).toBeGreaterThan(1), { timeout: 5000 });
  rescueModel.stopRequested();
  await vi.waitFor(() => expect(rescueModel.$busy.getState()).toBe(false), { timeout: 5000 });

  expect(watch.resets).toBe(0);
  expect(rescueModel.$done.getState()).toBeNull();
  expect(rescueModel.$error.getState()).toBeNull();
});

test("closing the picker is not retried", async () => {
  watch.picker = true;
  rescueModel.resetRequested();
  await vi.waitFor(() => expect(rescueModel.$busy.getState()).toBe(false), { timeout: 5000 });

  expect(watch.connects).toEqual([false]);
  expect(rescueModel.$error.getState()).not.toBeNull();
});

test("delete asks the watch for every face this browser installed, and counts the ones it had", async () => {
  localStorage.setItem(
    "fmc_dial_names",
    JSON.stringify({ 101: { name: "A" }, 202: { name: "BZ Rotator" }, 303: { name: "C" } }),
  );
  watch.installed = [202, 303];
  watch.fails = 1;
  rescueModel.facesRequested();
  await vi.waitFor(
    () => expect(rescueModel.$done.getState()).toEqual({ action: "faces", deleted: 2 }),
    {
      timeout: 5000,
    },
  );

  expect(watch.deleted).toEqual([101, 202, 303]);
  expect(watch.resets).toBe(0);
  localStorage.removeItem("fmc_dial_names");
});

test("a pasted key is saved with the faces that came with it; text without a key is refused", async () => {
  localStorage.removeItem("fmc_authkey");
  rescueModel.keyTextChanged("fmc_authkey=null\nfmc_dial_names=null");
  rescueModel.keySubmitted();
  await vi.waitFor(() => expect(rescueModel.$keyRejected.getState()).toBe(true));
  expect(localStorage.getItem("fmc_authkey")).toBeNull();

  rescueModel.keyTextChanged(
    'fmc_authkey=00112233445566778899AABBCCDDEEFF\nfmc_dial_names={"77":{"name":"Old"}}',
  );
  rescueModel.keySubmitted();
  await vi.waitFor(() => expect(rescueModel.$keyed.getState()).toBe(true));

  expect(localStorage.getItem("fmc_authkey")).toBe("00112233445566778899aabbccddeeff");
  expect(rescueModel.$faces.getState()).toBe(1);
  expect(rescueModel.$keyRejected.getState()).toBe(false);
  localStorage.removeItem("fmc_authkey");
  localStorage.removeItem("fmc_dial_names");
});
