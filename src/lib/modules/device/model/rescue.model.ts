// The /rescue page: a watch that is alive on Bluetooth but stuck on a black screen after a bad
// face gets one command — factory reset — the moment auth completes. Nothing else is asked of
// it, because a wedged firmware may never answer the usual info/dial-list exchange.
//
// A wedged watch may be reachable only now and then (between restarts, while an alarm shows), so
// after the one pick the page keeps reconnecting to the same watch until the reset goes out or
// the user stops it. ponytail: a fixed short pause between attempts — Web Bluetooth can't
// watch for the advertisement without a flag, so gatt.connect() itself is the probe.
import { attach, createEffect, createEvent, createStore, sample, type StoreValue } from "effector";
import { ESCAPE_CMD, hasSavedKey, importKey, Watch } from "../lib/ble";
import { flashedHere, importFlashed } from "../lib/catalog-names";
import { buildBin, TAG } from "$lib/modules/editor/core/format";
import { dbgListeners } from "../lib/ble-protocol";
import { t } from "../i18n";
import { bleText, bt } from "../messages";

export const resetRequested = createEvent();
/** The gentler action: delete the faces this browser installed, the bad one among them. */
export const facesRequested = createEvent();
/** The way out that needs no key: make the next boot fall back to the stock faces (Watch 3 Pro). */
export const stockRequested = createEvent();
export const stopRequested = createEvent();
export type RescueResult =
  | { action: "reset" }
  | { action: "faces"; deleted: number }
  | { action: "stock" };
type Words = StoreValue<typeof t>;

export const $status = createStore("");
export const $error = createStore<string | null>(null);
export const $done = createStore<RescueResult | null>(null);
// everything ble.ts logged during the attempt, for the user to paste into an issue
export const $log = createStore<string[]>([]);

const statusChanged = createEvent<string>();
const RETRY_MS = 300;
// read inside the running effect, which a store can't be awaited from
let stopping = false;
// the picker closed without a choice, or no permission: nothing to retry
const pickerClosed = (e: unknown) => e instanceof Error && /NotFound|Security|Abort/.test(e.name);
// shellBlast refusing another model: retrying won't change the watch
const wrongModel = (e: unknown) => e instanceof Error && /for a CMF Watch 3 Pro/.test(e.message);
const logged = createEvent<string>();
// what the watch pulls during a delete and throws away: the smallest file that parses as a face
const FILLER = buildBin({
  name: "FMC rescue",
  screens: [{ tag: TAG.main, subs: [{ tag: TAG.name, text: "FMC rescue" }] }],
  resources: [],
});
const stopFx = createEffect(() => {
  stopping = true;
});
const rescueFx = attach({
  source: t,
  mapParams: (action: RescueResult["action"], t) => ({ action, t }),
  effect: createEffect(
    async ({
      action,
      t,
    }: {
      action: RescueResult["action"];
      t: Words;
    }): Promise<RescueResult | null> => {
      const w = new Watch((s: string) => statusChanged(s));

      stopping = false;
      dbgListeners.add(logged);
      try {
        for (let attempt = 1; !stopping; attempt++) {
          try {
            if (action === "stock") {
              statusChanged(t.switchingToStock);
              if (await w.shellBlast(ESCAPE_CMD, attempt > 1)) return { action };
              throw new Error("the watch went quiet: it is still restarting");
            }
            await w.connect({ rescue: true, again: attempt > 1 });
            if (stopping) break;
            if (action === "reset") {
              statusChanged(t.sendingReset);
              await w.factoryReset();
              return { action };
            }
            statusChanged(t.deletingFaces);
            let deleted = 0;

            // a delete the watch answers "not there" for is fine: an older face, or one the
            // last attempt already took before the link dropped
            for (const id of flashedHere()) if (await w.deleteDial(id, FILLER)) deleted++;
            return { action, deleted };
          } catch (e) {
            if (pickerClosed(e) || wrongModel(e) || stopping) throw e;
            logged(`attempt ${attempt} failed: ${(e as Error).message}`);
            statusChanged(t.rescueRetrying(attempt + 1));
            await new Promise((r) => setTimeout(r, RETRY_MS));
          }
        }
        return null;
      } finally {
        dbgListeners.delete(logged);
        try {
          w.device?.gatt?.disconnect();
        } catch {
          /* already gone */
        }
      }
    },
  ),
});

export const $busy = rescueFx.pending;

// A key paired somewhere this page can't read — another browser, or the address the site moved
// from — pasted in by hand, with the faces installed there if the text carries them.
export const keyTextChanged = createEvent<string>();
export const keySubmitted = createEvent();
export const $keyText = createStore("").on(keyTextChanged, (_, text) => text);
const importKeyFx = createEffect((text: string) => {
  if (!importKey(text)) throw new Error("no key in the pasted text");
  importFlashed(text);
  return flashedHere().length;
});

export const $keyed = createStore(hasSavedKey()).on(importKeyFx.done, () => true);
export const $keyImported = createStore(false).on(importKeyFx.done, () => true);
export const $keyRejected = createStore(false)
  .on(importKeyFx.fail, () => true)
  .reset(importKeyFx.done, keyTextChanged);
/** How many faces the delete action would ask the watch for. */
export const $faces = createStore(flashedHere().length).on(importKeyFx.doneData, (_, n) => n);

sample({
  clock: keySubmitted,
  source: $keyText,
  target: importKeyFx,
});

sample({
  clock: resetRequested,
  fn: () => "reset" as const,
  target: rescueFx,
});
sample({
  clock: facesRequested,
  fn: () => "faces" as const,
  target: rescueFx,
});
sample({
  clock: stockRequested,
  fn: () => "stock" as const,
  target: rescueFx,
});
sample({
  clock: stopRequested,
  target: stopFx,
});
sample({
  clock: statusChanged,
  source: bt,
  fn: bleText,
  target: $status,
});
$error.on(rescueFx, () => null);
sample({
  clock: rescueFx.failData,
  source: bt,
  fn: (w, e) => (stopping ? null : bleText(w, e.message)),
  target: $error,
});
$done.on(rescueFx, () => null).on(rescueFx.doneData, (_, result) => result);
$log
  .on(rescueFx, () => [])
  .on(logged, (log, line) => [...log, line])
  .on(rescueFx.failData, (log, e) => [...log, `error: ${e.message}`]);
