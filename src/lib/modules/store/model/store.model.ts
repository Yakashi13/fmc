// The store's curated shelves — apps and firmware — as effector stores.
//
// Two shelves with the same life: a list fetched once per session, and one record behind a
// detail page. The detail page is a deep link, so it always asks for its record; when the list
// is already here it shows that copy first and the fetch only refreshes it.
import { createEvent, createStore, sample, type Effect } from "effector";
import type { RecordModel } from "pocketbase";
import * as storeApi from "./store.api";

export { appDownloadUrl, firmwareDownloadUrl } from "./store.api";

export const $storeErr = createStore("");

function shelf(loadListFx: Effect<void, RecordModel[]>, loadOneFx: Effect<string, RecordModel>) {
  const $list = createStore<RecordModel[]>([]);
  const $loaded = createStore(false);
  const $id = createStore("");
  const $one = createStore<RecordModel | null>(null);
  const listRequested = createEvent();
  const oneRequested = createEvent<string>();

  sample({
    clock: listRequested,
    source: $loaded,
    filter: (loaded) => !loaded,
    target: loadListFx,
  });
  sample({
    clock: loadListFx.doneData,
    target: $list,
  });
  sample({
    clock: loadListFx.done,
    fn: () => true,
    target: $loaded,
  });

  sample({
    clock: oneRequested,
    target: [$id, loadOneFx],
  });
  sample({
    clock: oneRequested,
    source: $list,
    fn: (list, id) => list.find((rec) => rec.id === id) ?? null,
    target: $one,
  });
  // a slow answer for the page you already left must not replace the one you are on
  sample({
    clock: loadOneFx.done,
    source: $id,
    filter: (id, { params }) => id === params,
    fn: (_, { result }) => result,
    target: $one,
  });

  sample({
    clock: [listRequested, oneRequested],
    fn: () => "",
    target: $storeErr,
  });
  // a missing record is the page's own "not found", not an error banner
  sample({
    clock: loadListFx.failData,
    fn: (e) => e.message,
    target: $storeErr,
  });

  return { $list, $one, listRequested, oneRequested };
}

const apps = shelf(storeApi.loadAppsFx, storeApi.loadAppFx);
const firmwares = shelf(storeApi.loadFirmwaresFx, storeApi.loadFirmwareFx);

export const $apps = apps.$list;
export const $app = apps.$one;
export const $appsLoading = storeApi.loadAppsFx.pending;
export const $appLoading = storeApi.loadAppFx.pending;
export const appsRequested = apps.listRequested;
export const appRequested = apps.oneRequested;

export const $firmwares = firmwares.$list;
export const $firmware = firmwares.$one;
export const $firmwaresLoading = storeApi.loadFirmwaresFx.pending;
export const $firmwareLoading = storeApi.loadFirmwareFx.pending;
export const firmwaresRequested = firmwares.listRequested;
export const firmwareRequested = firmwares.oneRequested;

// The firmware page keeps its download behind a tick: an image can brick the watch, and the
// reader should have said so themselves. Asked again for every image.
export const $riskAccepted = createStore(false);
export const riskAcceptedSet = createEvent<boolean>();

sample({
  clock: riskAcceptedSet,
  target: $riskAccepted,
});
sample({
  clock: firmwareRequested,
  fn: () => false,
  target: $riskAccepted,
});
