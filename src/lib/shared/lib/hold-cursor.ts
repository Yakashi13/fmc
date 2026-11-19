// While a press drags something (a slider knob, a list grip, a panel edge), the cursor belongs to
// the gesture, not to whatever happens to be under the pointer: without this it flips back to an
// arrow or an I-beam the moment the pointer leaves the thing it grabbed. `holdCursor` pins it on
// the whole document (see `[data-held-cursor]` in global.css) until the press ends; calling it
// again mid-press just swaps the cursor (a panel edge turns single-headed at its clamp).
export function holdCursor(cursor: string) {
  const root = document.documentElement;
  const held = root.dataset.heldCursor !== undefined;

  root.style.setProperty("--held-cursor", cursor);
  root.dataset.heldCursor = "";
  if (held) return;

  const release = () => {
    delete root.dataset.heldCursor;
    root.style.removeProperty("--held-cursor");
    removeEventListener("pointerup", release, true);
    removeEventListener("pointercancel", release, true);
    removeEventListener("blur", release);
  };

  // capture phase: a captured pointer or a handler that stops propagation can't swallow the release
  addEventListener("pointerup", release, true);
  addEventListener("pointercancel", release, true);
  addEventListener("blur", release);
}
