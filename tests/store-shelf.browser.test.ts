// The store's curated shelves (apps, firmware) share one life: a list fetched once per session
// and a detail page that shows the list's copy while its own fetch is in flight. A firmware
// download also waits behind a risk tick that must not carry over from one image to the next.
import { test, expect } from "vitest";
import type { RecordModel } from "pocketbase";
import { allSettled, fork } from "effector";
import { storeModel } from "$lib/modules/store/model";
import * as storeApi from "$lib/modules/store/model/store.api";

const rec = (id: string, extra: Record<string, unknown> = {}) =>
  ({ id, name: id, ...extra }) as unknown as RecordModel;

test("the list is fetched once, however often the shelf is opened", async () => {
  let calls = 0;
  const scope = fork({
    handlers: [
      [
        storeApi.loadAppsFx,
        () => {
          calls++;
          return [rec("a1")];
        },
      ],
    ],
  });

  await allSettled(storeModel.appsRequested, { scope });
  await allSettled(storeModel.appsRequested, { scope });

  expect(calls).toBe(1);
  expect(scope.getState(storeModel.$apps)).toEqual([rec("a1")]);
});

test("a failed list load is reported and may be retried", async () => {
  let calls = 0;
  const scope = fork({
    handlers: [
      [
        storeApi.loadFirmwaresFx,
        () => {
          calls++;
          throw new Error("offline");
        },
      ],
    ],
  });

  await allSettled(storeModel.firmwaresRequested, { scope });
  expect(scope.getState(storeModel.$storeErr)).toBe("offline");

  await allSettled(storeModel.firmwaresRequested, { scope });
  expect(calls).toBe(2);
});

test("a detail page starts from the list's copy and ends on the fresh record", async () => {
  const seen: (RecordModel | null)[] = [];
  const scope = fork({
    values: [[storeModel.$apps, [rec("a1", { downloads: 1 })]]],
    handlers: [
      [
        storeApi.loadAppFx,
        () => {
          seen.push(scope.getState(storeModel.$app));
          return rec("a1", { downloads: 2 });
        },
      ],
    ],
  });

  await allSettled(storeModel.appRequested, { scope, params: "a1" });

  expect(seen).toEqual([rec("a1", { downloads: 1 })]);
  expect(scope.getState(storeModel.$app)).toEqual(rec("a1", { downloads: 2 }));
});

test("a slow answer for the page you left doesn't replace the one you are on", async () => {
  const release: Record<string, () => void> = {};
  const scope = fork({
    handlers: [
      [
        storeApi.loadAppFx,
        (id: string) => new Promise<RecordModel>((done) => (release[id] = () => done(rec(id)))),
      ],
    ],
  });

  const first = allSettled(storeModel.appRequested, { scope, params: "slow" });
  const second = allSettled(storeModel.appRequested, { scope, params: "fast" });

  release.fast();
  release.slow();
  await Promise.all([first, second]);

  expect(scope.getState(storeModel.$app)?.id).toBe("fast");
});

test("a missing record leaves the page empty without an error banner", async () => {
  const scope = fork({
    handlers: [
      [
        storeApi.loadFirmwareFx,
        () => {
          throw new Error("404");
        },
      ],
    ],
  });

  await allSettled(storeModel.firmwareRequested, { scope, params: "gone" });

  expect(scope.getState(storeModel.$firmware)).toBeNull();
  expect(scope.getState(storeModel.$storeErr)).toBe("");
});

test("the risk tick is asked again for every image", async () => {
  const scope = fork({ handlers: [[storeApi.loadFirmwareFx, (id: string) => rec(id)]] });

  await allSettled(storeModel.firmwareRequested, { scope, params: "f1" });
  await allSettled(storeModel.riskAcceptedSet, { scope, params: true });
  expect(scope.getState(storeModel.$riskAccepted)).toBe(true);

  await allSettled(storeModel.firmwareRequested, { scope, params: "f2" });
  expect(scope.getState(storeModel.$riskAccepted)).toBe(false);
});
