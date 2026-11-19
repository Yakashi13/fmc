import { test, expect, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { userEvent } from "vitest/browser";
import DialogFixture from "./__fixtures__/dialog-fixture.svelte";

test("closed dialog is not rendered and its close button is unreachable", async () => {
  const screen = await render(DialogFixture, { open: false });

  await expect.element(screen.getByRole("dialog")).not.toBeInTheDocument();
  await expect.element(screen.getByRole("button", { name: "Close" })).not.toBeInTheDocument();
});

test("open dialog is visible", async () => {
  const screen = await render(DialogFixture, { open: true });

  await expect.element(screen.getByRole("dialog")).toBeVisible();
  await expect.element(screen.getByRole("button", { name: "Close" })).toBeVisible();
});

test("Escape closes an open dialog", async () => {
  const onClose = vi.fn();
  const screen = await render(DialogFixture, { open: true, onClose });

  await expect.element(screen.getByRole("dialog")).toBeVisible();
  await userEvent.keyboard("{Escape}");
  // on a phone-width page the dialog is a sheet: it closes once it has slid down
  await expect.poll(() => onClose.mock.calls.length).toBeGreaterThan(0);
});
