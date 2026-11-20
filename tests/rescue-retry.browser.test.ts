// The rescue page keeps reconnecting to the picked watch until the factory reset goes out: a
// wedged watch is reachable only now and then. Drives the real rescue.model against a stub watch.
import { beforeEach, expect, test, vi } from "vitest";
import { rescueModel } from "$lib/modules/device/model";

const watch = vi.hoisted(() => ({ fails: 0, connects: [] as boolean[], resets: 0, picker: false }));

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
  }

  return { ...(await importOriginal<object>()), Watch };
});

beforeEach(() => Object.assign(watch, { fails: 0, connects: [], resets: 0, picker: false }));

test("a watch that drops twice gets the reset on the third try, picked only once", async () => {
  watch.fails = 2;
  rescueModel.resetRequested();
  await vi.waitFor(() => expect(rescueModel.$done.getState()).toBe(true), { timeout: 5000 });

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
  expect(rescueModel.$done.getState()).toBe(false);
  expect(rescueModel.$error.getState()).toBeNull();
});

test("closing the picker is not retried", async () => {
  watch.picker = true;
  rescueModel.resetRequested();
  await vi.waitFor(() => expect(rescueModel.$busy.getState()).toBe(false), { timeout: 5000 });

  expect(watch.connects).toEqual([false]);
  expect(rescueModel.$error.getState()).not.toBeNull();
});
