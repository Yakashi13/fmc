import skus from "./watch-skus.json";
export const MANUFACTURERS = [0x0ccb, 0x2cbe, 0xbe2c, 0xffff];
export const WATCH_MODELS = {
  "82D5BB72": "watch_pro",
  "34F72851": "watch_pro_2",
  "335BBD62": "watch_3_pro",
} as const;

export type WatchModel = (typeof WATCH_MODELS)[keyof typeof WATCH_MODELS];
export interface WatchIdentity {
  productId: string;
  model: WatchModel | null;
  colorId: string | null;
  color: string | null;
  source: "advertisement" | "shell";
}
export function identity(
  productId: string,
  colorId: string | null,
  source: WatchIdentity["source"],
): WatchIdentity {
  const pid = productId.toUpperCase(),
    color = colorId?.toUpperCase() ?? null;

  return {
    productId: pid,
    model: WATCH_MODELS[pid as keyof typeof WATCH_MODELS] ?? null,
    colorId: color,
    color: color ? ((skus as Record<string, string>)[pid + color] ?? null) : null,
    source,
  };
}
/** Manufacturer data excludes its company-ID bytes. Do not retain the embedded MAC address. */
export function advertisementIdentity(company: number, data: DataView): WatchIdentity | null {
  if (!MANUFACTURERS.includes(company)) return null;
  const bytes = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const normalized = company === 0x0ccb ? bytes : new Uint8Array([0x2c, 0xbe, ...bytes]);
  let offset: number;

  if (normalized.length >= 18 && new TextDecoder().decode(normalized.slice(6, 12)) === "JX-IWD")
    offset = 12;
  else if (normalized.length >= 14 && normalized[6] === 0x4a && normalized[7] === 0x58) offset = 8;
  else return null;
  const hex = (a: Uint8Array) =>
    [...a]
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();

  return identity(
    hex(normalized.slice(offset, offset + 4)),
    hex(normalized.slice(offset + 4, offset + 5)),
    "advertisement",
  );
}
export function productReply(reply: string): WatchIdentity | null {
  const match = reply.match(/(?:^|[\r\n])(?:AT )?GETPID:([0-9a-f]{8}),OK(?:$|[\r\n])/i);

  return match ? identity(match[1], null, "shell") : null;
}
/** Best effort only: unsupported/denied advertisement watching must never block GATT connection. */
export async function observeIdentity(device: BluetoothDevice): Promise<WatchIdentity | null> {
  const d = device as BluetoothDevice & {
    watchAdvertisements?: (o: { signal: AbortSignal }) => Promise<void>;
  };

  if (!d.watchAdvertisements) return null;
  return new Promise((resolve) => {
    const controller = new AbortController();
    let done = false;
    const finish = (v: WatchIdentity | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      device.removeEventListener("advertisementreceived", receive);
      controller.abort();
      resolve(v);
    };
    const receive = (e: Event) => {
      const event = e as Event & { manufacturerData: Map<number, DataView> };

      for (const [id, data] of event.manufacturerData ?? []) {
        const value = advertisementIdentity(id, data);

        if (value) {
          finish(value);
          return;
        }
      }
    };
    const timer = setTimeout(() => finish(null), 1200);

    device.addEventListener("advertisementreceived", receive);
    try {
      d.watchAdvertisements({ signal: controller.signal }).catch(() => finish(null));
    } catch {
      finish(null);
    }
  });
}
