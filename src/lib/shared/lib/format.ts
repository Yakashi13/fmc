// Number formatting shared by the shelves: a card has room for "1.3K", not "1335".
const compactFormat = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** 1335 -> "1.3K". Counters come back from PocketBase as 0 or missing interchangeably. */
export const compact = (n: number | undefined): string => compactFormat.format(n || 0);

export const day = (iso: string): string => new Date(iso).toLocaleDateString();
