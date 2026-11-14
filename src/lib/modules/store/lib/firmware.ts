// What the `kind` and `tested` selects on a firmware record mean to a reader. The keys are the
// schema's values (1754000000_store.js in fmc_pocketbase) and change together with it.

export interface FirmwareKind {
  label: string;
  /** A Material Symbols name. */
  icon: string;
  hint: string;
}

export const KINDS: Record<string, FirmwareKind> = {
  patched: {
    label: "Patched stock",
    icon: "build",
    hint: "The vendor firmware with a patch on top. Everything else stays stock.",
  },
  custom: {
    label: "Custom",
    icon: "science",
    hint: "Its own application: it replaces what the watch normally runs.",
  },
  stock: {
    label: "Stock",
    icon: "history",
    hint: "An untouched vendor image, kept for going back.",
  },
};

const UNKNOWN: FirmwareKind = { label: "Firmware", icon: "memory", hint: "" };

export const firmwareKind = (kind: unknown): FirmwareKind => KINDS[String(kind)] ?? UNKNOWN;

/** Proven on a physical watch, or only in the emulator — or nobody said. */
export const testedOnHardware = (tested: unknown): boolean => tested === "hardware";
export const testedLabel = (tested: unknown): string =>
  tested === "hardware" ? "Tested on a watch" : tested === "emulator" ? "Emulator only" : "";
