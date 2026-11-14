// The store's curated shelves — apps and firmware: PocketBase API effects.
// Both collections are read-only for everyone but a superuser (see 1754000000_store.js in
// fmc_pocketbase), so there is nothing here but loading.
import { createEffect } from "effector";
import type { RecordModel } from "pocketbase";
import { pb } from "$lib/shared/api";

export const loadAppsFx = createEffect(() =>
  pb.collection("apps").getFullList({ sort: "-downloads,name" }),
);
export const loadAppFx = createEffect((id: string) => pb.collection("apps").getOne(id));

export const loadFirmwaresFx = createEffect(() =>
  pb.collection("firmwares").getFullList({ sort: "-downloads,name" }),
);
export const loadFirmwareFx = createEffect((id: string) => pb.collection("firmwares").getOne(id));

// the hook behind these bumps `downloads` and redirects to the file
export const appDownloadUrl = (rec: RecordModel) => `${pb.baseURL}/api/apps/${rec.id}/download`;
export const firmwareDownloadUrl = (rec: RecordModel) =>
  `${pb.baseURL}/api/firmwares/${rec.id}/download`;
