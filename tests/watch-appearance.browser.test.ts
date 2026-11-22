import "../src/lib/styles/tokens.css";
import { test, expect } from "vitest";
import { createEvent, sample } from "effector";
import { render } from "vitest-browser-svelte";
import WatchCase from "$lib/shared/components/watch-case/watch-case.svelte";
import { watchAppearanceModel, bleModel } from "$lib/modules/device/model";
import { identity } from "$lib/modules/device/lib/watch-identity";
test("manual preview never changes reported identity and reconnect resets overrides", async () => {
  const info = {
    name: "Renamed watch",
    battery: 80,
    firmware: "1.0.1.77",
    serial: null,
    identity: identity("335BBD62", "23", "advertisement"),
  };
  const simulateConnection = createEvent<typeof info>();

  sample({
    clock: simulateConnection,
    target: [bleModel.$bleInfo, bleModel.connected],
  });
  simulateConnection(info);
  await render(WatchCase);
  await expect
    .poll(() => document.querySelector(".case img")?.getAttribute("src"))
    .toBe("/frames/watch-3-pro-orange.webp");
  watchAppearanceModel.previewModelPicked("watch_pro_2");
  watchAppearanceModel.previewColorPicked("blue");
  await expect
    .poll(() => document.querySelector(".case img")?.getAttribute("src"))
    .toBe("/frames/watch-pro-2-blue.webp");
  expect(info.identity.model).toBe("watch_3_pro");
  simulateConnection(info);
  await expect
    .poll(() => document.querySelector(".case img")?.getAttribute("src"))
    .toBe("/frames/watch-3-pro-orange.webp");
  watchAppearanceModel.previewModelPicked("auto");
  watchAppearanceModel.previewColorPicked("auto");
});

test.each([
  ["desktop", 1280, 900],
  ["phone", 375, 812],
] as const)(
  "Watch Frame remains open and Automatic restores both selections on %s",
  async (_device, width, height) => {
    const { page } = await import("vitest/browser");

    await page.viewport(width, height);
    const { default: WatchFrameDialog } =
      await import("$lib/modules/device/components/watch-frame-dialog.svelte");

    const connect = createEvent<import("$lib/modules/device/lib/ble").WatchInfo>();

    sample({
      clock: connect,
      target: [bleModel.$bleInfo, bleModel.connected],
    });
    connect({
      name: "CMF Watch Pro 2",
      battery: 80,
      firmware: "1.0.0.73",
      serial: null,
      identity: identity("34F72851", "13", "advertisement"),
    });
    await render(WatchCase);
    await render(WatchFrameDialog);
    watchAppearanceModel.framePanelOpened();
    const dialog = () => document.querySelector("dialog[open]");

    await expect.poll(dialog).toBeTruthy();
    await Promise.all(
      dialog()!
        .getAnimations({ subtree: true })
        .map((animation) => animation.finished),
    );
    const initial = dialog()!.getBoundingClientRect();

    await page.getByRole("button", { name: "Watch 3 Pro", exact: true }).click();
    await page.getByRole("button", { name: "Green", exact: true }).click();
    expect(dialog()).toBeTruthy();
    await expect
      .poll(() => document.querySelector(".case img")?.getAttribute("src"))
      .toBe("/frames/watch-3-pro-green.webp");
    expect(dialog()!.getBoundingClientRect().top).toBe(initial.top);
    await page.getByRole("switch", { name: "Automatic", exact: true }).click();
    await expect
      .poll(() => document.querySelector(".case img")?.getAttribute("src"))
      .toBe("/frames/watch-pro-2-orange.webp");
    expect(dialog()).toBeTruthy();
    expect(watchAppearanceModel.$previewModel.getState()).toBe("auto");
    expect(watchAppearanceModel.$previewColor.getState()).toBe("auto");
    await page.getByRole("switch", { name: "Automatic", exact: true }).click();
    expect(watchAppearanceModel.$previewModel.getState()).toBe("watch_pro_2");
    expect(watchAppearanceModel.$previewColor.getState()).toBe("orange");
    watchAppearanceModel.framePanelClosed();
  },
);
