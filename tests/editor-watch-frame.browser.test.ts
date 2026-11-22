import "../src/lib/styles/tokens.css";
import { expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-svelte";
import { EditorPage } from "$lib/modules/editor/pages";
import { editorModel } from "$lib/modules/editor/model";
import { watchAppearanceModel } from "$lib/modules/device/model";
import { newNodeId, type Doc } from "$lib/modules/editor/core/document/doc";

test.each([
  ["watch_pro_2", 1440, 900],
  ["watch_3_pro", 1440, 900],
  ["watch_pro_2", 390, 844],
  ["watch_3_pro", 390, 844],
] as const)(
  "frame toggle preserves the dial and document for %s at %d × %d",
  async (model, width, height) => {
    await page.viewport(width, height);
    watchAppearanceModel.previewModelPicked(model);
    const doc: Doc = {
      name: "Frame preview",
      nameRaw: "",
      screens: [{ id: newNodeId(), kind: "main", layers: [] }],
      images: new Map(),
    };

    editorModel.docLoaded({ doc, label: "Frame preview" });
    if (!editorModel.$showWatchFrame.getState()) editorModel.watchFrameToggled();
    const view = await render(EditorPage);

    view.container.style.height = `${height}px`;
    const toggle = page.getByRole("button", { name: "Watch frame", exact: true });
    const canvas = document.querySelector<HTMLCanvasElement>(".canvas")!;
    const bounds = () => {
      const { x, y, width, height } = canvas.getBoundingClientRect();

      return { x, y, width, height };
    };
    const before = bounds();

    await expect.element(toggle).toHaveAttribute("aria-pressed", "true");
    await toggle.click();
    await expect.element(toggle).toHaveAttribute("aria-pressed", "false");
    expect(document.querySelector(".case .render")).toBeNull();
    expect(bounds()).toEqual(before);
    expect(document.querySelector(".canvas")).toBe(canvas);
    await userEvent.keyboard("{Enter}");
    await expect.element(toggle).toHaveAttribute("aria-pressed", "true");
    expect(document.querySelector(".case .render")).not.toBeNull();
    expect(bounds()).toEqual(before);
    await userEvent.keyboard("{Shift>}F{/Shift}");
    await expect.element(toggle).toHaveAttribute("aria-pressed", "false");
    await userEvent.keyboard("{Shift>}F{/Shift}");
    await expect.element(toggle).toHaveAttribute("aria-pressed", "true");
    expect(document.querySelector('.toolbar button[aria-label="Watch frame"]')).toBeNull();
    expect(editorModel.$doc.getState()).toBe(doc);
    expect(editorModel.$dirty.getState()).toBe(false);
    expect(editorModel.$undoN.getState()).toBe(0);
  },
);
