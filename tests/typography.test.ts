// The type scale is global.css's `.type-*` classes and nothing else: a component that sets its
// own font-size/weight/family/letter-spacing drifts off the scale. Runs in the "unit" project.
import { test, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// sizes that aren't text: a glyph font sized to its box, initials scaled to an avatar
const ALLOWED = ["shared/components/icon/icon.svelte", "shared/components/avatar/avatar.svelte"];
// `font: inherit` (a control taking its parent's step) and `line-height: 1` (a glyph box) stay legal
const BANNED =
  /^\s*(font-size|font-weight|font-family|font-stretch|letter-spacing|text-transform:\s*uppercase|line-height:(?!\s*1;)|font:(?!\s*inherit;))/m;

function* svelteFiles(dir: string): Generator<string> {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);

    if (e.isDirectory()) yield* svelteFiles(p);
    else if (p.endsWith(".svelte")) yield p;
  }
}

test("no component sets its own type", () => {
  const offenders = [...svelteFiles("src")]
    .filter((f) => !ALLOWED.some((a) => f.endsWith(a)))
    .flatMap((f) =>
      readFileSync(f, "utf8")
        .split("\n")
        .map((l, i) => (BANNED.test(l) ? `${f}:${i + 1}  ${l.trim()}` : null))
        .filter((x) => x !== null),
    );

  expect(offenders).toEqual([]);
});
