// The store's curated shelves — apps and firmware: PocketBase API effects.
// Both collections are read-only for everyone but a superuser (see 1754000000_store.js in
// fmc_pocketbase), so there is nothing here but loading.
import { createEffect } from "effector";
import type { RecordModel } from "pocketbase";
import { fileUrl, pb } from "$lib/shared/api";
import { parsePackageHeader, type Wp2Package } from "$lib/modules/device/lib/wp2";

export const loadAppsFx = createEffect(() =>
  pb.collection("apps").getFullList({ sort: "-downloads,name" }),
);
export const loadAppFx = createEffect((id: string) => pb.collection("apps").getOne(id));

export const loadFirmwaresFx = createEffect(() =>
  pb.collection("firmwares").getFullList({ sort: "-downloads,name" }),
);
export const loadFirmwareFx = createEffect((id: string) => pb.collection("firmwares").getOne(id));

// The image itself, for a flash from the page. Through the download hook like a download, so a
// flash counts too.
export const fetchFirmwareImageFx = createEffect(async (rec: RecordModel) => {
  const res = await fetch(firmwareDownloadUrl(rec));

  if (!res.ok) throw new Error(`couldn't fetch the image (${res.status})`);
  return new Uint8Array(await res.arrayBuffer());
});

// the hook behind these bumps `downloads` and redirects to the file
export const appDownloadUrl = (rec: RecordModel) => `${pb.baseURL}/api/apps/${rec.id}/download`;
export const firmwareDownloadUrl = (rec: RecordModel) =>
  `${pb.baseURL}/api/firmwares/${rec.id}/download`;

// The 64-byte header at the front of a .wp2app: name, version and image CRC — all a comparison
// with the watch needs, so only those bytes are fetched (PocketBase serves files with Range).
// Straight from the file URL, not the download hook: looking isn't downloading.
export const fetchAppHeadersFx = createEffect(async (apps: RecordModel[]) => {
  const out: Record<string, Wp2Package> = {};

  await Promise.all(
    apps
      .filter((rec) => rec.package)
      .map(async (rec) => {
        const res = await fetch(fileUrl(rec, "package"), { headers: { Range: "bytes=0-63" } });

        if (!res.ok) return;
        const h = parsePackageHeader(new Uint8Array(await res.arrayBuffer()).subarray(0, 64));

        if (h) out[rec.id] = h;
      }),
  );
  return out;
});
