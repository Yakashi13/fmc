// A face too heavy for a Watch 3 Pro still goes out, re-encoded to fit, and the user is told
// so — drives the real ble.model with the transport stubbed out (see flash-size-confirm).
import { expect, test, vi } from "vitest";
import { bleModel } from "$lib/modules/device/model";
import {
  buildBin,
  encodePixels,
  parseBin,
  shownResources,
  TAG,
} from "$lib/modules/editor/core/format";
import url from "./__fixtures__/Default__276__Dichotomy.bin?url";

const uploads = vi.hoisted((): Uint8Array[] => []);

vi.mock("$lib/modules/device/lib/ble", async (importOriginal) => {
  class Watch {
    name = "CMF Watch 3 Pro-9A9D";
    serial = null;
    onDials = () => {};
    async connect() {
      return { name: this.name, battery: null, firmware: null, serial: null };
    }
    async uploadWatchface(bin: Uint8Array) {
      uploads.push(bin);
      return { id: 1, name: "heavy" };
    }
    mergeDials() {}
  }

  return { ...(await importOriginal<object>()), Watch };
});

test("a heavy face installs compressed, and the note says so", async () => {
  const face = parseBin(await (await fetch(url)).arrayBuffer());
  const main = face.screens.find((s) => s.tag === TAG.main)!;
  const px = new Uint8ClampedArray(466 * 466 * 4).map((_, i) => (i * 7) & 255);

  [...shownResources(main, face.resources)].slice(0, 9).forEach((i) => {
    face.resources[i] = encodePixels(px, 466, 466, 5);
  });

  bleModel.connectRequested();
  await vi.waitFor(() => expect(bleModel.$bleInfo.getState()).not.toBeNull());
  bleModel.flashRequested({ bin: buildBin(face) });
  await vi.waitFor(() => expect(uploads).toHaveLength(1), { timeout: 30000 });

  expect(parseBin(uploads[0]).resources.some((r) => r.cf === 28)).toBe(true);
  await vi.waitFor(() =>
    expect(bleModel.$fitNote.getState()).toMatch(/images? (was|were) compressed/),
  );
}, 60000);
