// fitForWatch runs in a worker on the way to the watch (flashFx); it has to give back exactly
// what the main-thread version does, and the caller's own bytes when there is nothing to fit.
import { expect, test } from "vitest";
import {
  buildBin,
  encodePixels,
  fitForWatch,
  fitForWatchOffThread,
  parseBin,
  shownResources,
  TAG,
} from "$lib/modules/editor/core/format";
import url from "./__fixtures__/Default__276__Dichotomy.bin?url";

const art = (seed: number) => {
  const px = new Uint8ClampedArray(466 * 466 * 4);

  for (let i = 0; i < 466 * 466; i++)
    px.set([(i + seed * 40) & 255, (i >> 8) & 255, i & 127, i & 255], i * 4);
  return encodePixels(px, 466, 466, 5);
};

test("the worker fits a heavy face the same way the main thread does", async () => {
  const face = parseBin(await (await fetch(url)).arrayBuffer());
  const main = face.screens.find((s) => s.tag === TAG.main)!;

  [...shownResources(main, face.resources)].slice(0, 9).forEach((i, k) => {
    face.resources[i] = art(k);
  });
  const bin = buildBin(face);
  const off = await fitForWatchOffThread(bin, "watch_3_pro");

  expect(off).not.toBe(bin);
  expect(off).toEqual(fitForWatch(bin, "watch_3_pro"));
}, 60000);

test("a face with nothing to fit comes back as the caller's own bytes", async () => {
  const bin = new Uint8Array(await (await fetch(url)).arrayBuffer());

  expect(await fitForWatchOffThread(bin, "watch_3_pro")).toBe(bin);
});
