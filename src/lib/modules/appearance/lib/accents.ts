// The accent colors a user can pick in Account → Accent color.
//
// `value` is what lands in `--color-accent` on <html>. The default carries none: choosing it
// removes the override, so the colour comes from tokens.css exactly as before and a future
// change to the token still reaches everyone who never picked anything.
//
// `--color-on-accent` picks white or black ink from the accent's own lightness (tokens.css), so
// an entry can be as dark as the default red or as light as lime.

export interface Accent {
  id: string;
  label: string;
  /** the `--color-accent` override; null keeps the tokens.css one */
  value: string | null;
  /** what the picker's swatch paints */
  swatch: string;
}

export const DEFAULT_ACCENT = "red";

export const ACCENTS: readonly Accent[] = [
  // swatch mirrors `--color-accent` in tokens.css — the swatch must show red even while
  // another accent is active, so it can't read the live token
  { id: DEFAULT_ACCENT, label: "Red", value: null, swatch: "#d71921" },
  { id: "yellow", label: "Yellow", value: "#ffc700", swatch: "#ffc700" },
  { id: "orange", label: "Orange", value: "oklch(0.78 0.17 55)", swatch: "oklch(0.78 0.17 55)" },
  { id: "pink", label: "Pink", value: "oklch(0.76 0.17 350)", swatch: "oklch(0.76 0.17 350)" },
  { id: "purple", label: "Purple", value: "oklch(0.72 0.16 300)", swatch: "oklch(0.72 0.16 300)" },
  { id: "blue", label: "Blue", value: "oklch(0.74 0.14 250)", swatch: "oklch(0.74 0.14 250)" },
  { id: "cyan", label: "Cyan", value: "oklch(0.82 0.12 205)", swatch: "oklch(0.82 0.12 205)" },
  { id: "green", label: "Green", value: "oklch(0.82 0.18 150)", swatch: "oklch(0.82 0.18 150)" },
  { id: "lime", label: "Lime", value: "oklch(0.88 0.19 125)", swatch: "oklch(0.88 0.19 125)" },
];

/** The accent for a stored id; anything unknown (an old or edited value) is the default. */
export const accentById = (id: string | null | undefined): Accent =>
  ACCENTS.find((a) => a.id === id) ?? ACCENTS[0];
