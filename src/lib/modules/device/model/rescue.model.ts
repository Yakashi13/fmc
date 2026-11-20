// The /rescue page: a watch that is alive on Bluetooth but stuck on a black screen after a bad
// face gets one command — factory reset — the moment auth completes. Nothing else is asked of
// it, because a wedged firmware may never answer the usual info/dial-list exchange.
//
// A wedged watch may be reachable only now and then (between restarts, while an alarm shows), so
// after the one pick the page keeps reconnecting to the same watch until the reset goes out or
// the user stops it. ponytail: a fixed short pause between attempts — Web Bluetooth can't
// watch for the advertisement without a flag, so gatt.connect() itself is the probe.
import { attach, createEffect, createEvent, createStore, sample } from "effector";
import { Watch } from "../lib/ble";
import { dbgListeners } from "../lib/ble-protocol";
import { t } from "../i18n";
import { bleText, bt } from "../messages";

export const resetRequested = createEvent();
export const stopRequested = createEvent();
export const $status = createStore("");
export const $error = createStore<string | null>(null);
export const $done = createStore(false);
// everything ble.ts logged during the attempt, for the user to paste into an issue
export const $log = createStore<string[]>([]);

const statusChanged = createEvent<string>();
const RETRY_MS = 300;
// read inside the running effect, which a store can't be awaited from
let stopping = false;
// the picker closed without a choice, or no permission: nothing to retry
const pickerClosed = (e: unknown) => e instanceof Error && /NotFound|Security|Abort/.test(e.name);
const logged = createEvent<string>();
const stopFx = createEffect(() => {
  stopping = true;
});
const resetFx = attach({
  source: t,
  effect: async (t): Promise<boolean> => {
    const w = new Watch((s: string) => statusChanged(s));

    stopping = false;
    dbgListeners.add(logged);
    try {
      for (let attempt = 1; !stopping; attempt++) {
        try {
          await w.connect({ rescue: true, again: attempt > 1 });
          if (stopping) break;
          statusChanged(t.sendingReset);
          await w.factoryReset();
          return true;
        } catch (e) {
          if (pickerClosed(e) || stopping) throw e;
          logged(`attempt ${attempt} failed: ${(e as Error).message}`);
          statusChanged(t.rescueRetrying(attempt + 1));
          await new Promise((r) => setTimeout(r, RETRY_MS));
        }
      }
      return false;
    } finally {
      dbgListeners.delete(logged);
      try {
        w.device?.gatt?.disconnect();
      } catch {
        /* already gone */
      }
    }
  },
});

export const $busy = resetFx.pending;

sample({
  clock: resetRequested,
  target: resetFx,
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
$error.on(resetRequested, () => null);
sample({
  clock: resetFx.failData,
  source: bt,
  fn: (w, e) => (stopping ? null : bleText(w, e.message)),
  target: $error,
});
$done.on(resetRequested, () => false).on(resetFx.doneData, (_, sent) => sent);
$log
  .on(resetRequested, () => [])
  .on(logged, (log, line) => [...log, line])
  .on(resetFx.failData, (log, e) => [...log, `error: ${e.message}`]);
