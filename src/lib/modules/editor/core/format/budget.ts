// How much RAM a screen of a face takes on a Watch 3 Pro once it is on the display.
//
// The Watch 3 Pro (stock 1.0.1.77) decodes every image a screen shows into one 6.5 MB heap,
// "ResFbHeap", that it shares with the framebuffer, and keeps it decoded while the screen is up.
// When an allocation there fails, the firmware crashes on purpose (MllcFailedHook writes to
// address 0); the face loads again on the next boot, so the watch boot-loops. Measured in the
// cmf-watch-utils emulator on the stock firmware: ~0.78 MB of the heap is taken before a face
// loads; the FMC face that boot-looped (BZ Rotator) needed 9.96 MB and crashed on its ninth
// full-screen image with 5.2 MB of art loaded; the heaviest face published for the Watch 3 Pro
// (4.93 MB) runs.
//
// ponytail: one image per reference — the cache loads what is shown (a digit set or a frame
// run counts its largest frame once), which is what the crash and the catalog agree on. The
// Watch Pro 2 has the same loader and a slightly larger heap, but nothing there has crashed and
// faces past this budget run on it, so the budget is the Watch 3 Pro's alone until measured.

import type { Face, FaceNode, Resource } from "./raw";
import { TAG } from "./raw";

/** Decoded bytes one screen's images may take on a Watch 3 Pro. */
export const SCREEN_BUDGET = 5_000_000;

/** Bytes the firmware allocates to hold a resource decoded (WFaceRes.c, per colour format). */
export function decodedBytes({ cf, w, h }: Resource): number {
  switch (cf) {
    case 1: // JPEG, decoded to RGB565
    case 4:
      return w * h * 2;
    case 5:
      return w * h * 3;
    case 13:
      return ((w + 1) >> 1) * h;
    case 14:
      return w * h;
    case 24:
      return w * h * 4;
    case 28:
      return (((w + 3) >> 2) << 2) * (((h + 3) >> 2) << 2);
    default:
      return 0;
  }
}

/** The resources a screen shows at once: the largest image of each reference, the embedded
 *  preview left out (the face picker shows it, not the screen). */
export function shownResources(screen: FaceNode, resources: Resource[]): Set<number> {
  const shown = new Set<number>();
  const walk = (n: FaceNode) => {
    if (n.tag === TAG.preview) return;
    if (n.images?.length)
      shown.add(
        n.images.reduce((a, b) =>
          decodedBytes(resources[b]) > decodedBytes(resources[a]) ? b : a,
        ),
      );
    n.subs?.forEach(walk);
  };

  walk(screen);
  return shown;
}

export const screenBytes = (screen: FaceNode, resources: Resource[]) =>
  [...shownResources(screen, resources)].reduce((n, i) => n + decodedBytes(resources[i]), 0);

/** The screens of a face that a Watch 3 Pro can't hold, with what each needs. */
export const overBudget = (face: Face) =>
  face.screens
    .map((screen) => ({ screen, bytes: screenBytes(screen, face.resources) }))
    .filter((s) => s.bytes > SCREEN_BUDGET);
