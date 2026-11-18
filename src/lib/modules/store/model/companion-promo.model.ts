// The one-time "FMC Companion" banner over the watchface shelf. It goes away for good once the
// user closes it or opens the companion page.
//
// ponytail: "seen" lives in localStorage, so it is per browser, and everyone who hasn't closed it
// sees it once — returning visitors included, since nothing on the device marks a user as new.
import { createEffect, createEvent, createStore, sample } from "effector";

const STORAGE_KEY = "fmc:companion-promo-seen";

// storage can throw (private mode, blocked cookies): then the banner shows once per session
const readSeen = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

export const $promoVisible = createStore(!readSeen());

export const promoDismissed = createEvent();

const rememberFx = createEffect(() => {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // hidden for this session only
  }
});

sample({
  clock: promoDismissed,
  fn: () => false,
  target: $promoVisible,
});
sample({
  clock: promoDismissed,
  target: rememberFx,
});
