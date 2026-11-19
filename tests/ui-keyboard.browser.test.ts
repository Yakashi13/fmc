// The keyboard model of the shared popups and tabs: the WAI-ARIA menu button and tabs patterns,
// the behaviours UI SDK builds its components from (roving focus, typeahead, popup dismissal).
import { test, expect, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import { userEvent } from "vitest/browser";
import "$lib/styles/tokens.css";
import MenuKeys from "./__fixtures__/menu-keys-fixture.svelte";
import SelectFixture from "./__fixtures__/select-fixture.svelte";
import TabsFixture from "./__fixtures__/tabs-fixture.svelte";

const focused = () => document.activeElement?.textContent?.trim();

test("a keyboard-opened menu lands on its first row, arrows skip disabled rows and wrap", async () => {
  const screen = await render(MenuKeys);
  const trigger = screen.getByTestId("trigger");

  (trigger.element() as HTMLElement).focus();
  await expect.element(trigger).toHaveAttribute("aria-haspopup", "menu");
  await expect.element(trigger).toHaveAttribute("aria-expanded", "false");

  await userEvent.keyboard("{ArrowDown}");
  await expect.element(trigger).toHaveAttribute("aria-expanded", "true");
  await expect.poll(focused).toBe("downloadApple");

  await userEvent.keyboard("{ArrowDown}");
  expect(focused()).toBe("Cherry");
  await userEvent.keyboard("{End}{ArrowDown}");
  expect(focused()).toBe("downloadApple");
  await userEvent.keyboard("{ArrowUp}");
  expect(focused()).toBe("Cranberry");
});

test("typeahead finds a row by its label, a repeated letter cycles", async () => {
  const screen = await render(MenuKeys);

  (screen.getByTestId("trigger").element() as HTMLElement).focus();
  await userEvent.keyboard("{ArrowDown}");
  await expect.poll(focused).toBe("downloadApple");

  await userEvent.keyboard("c");
  expect(focused()).toBe("Cherry");
  await userEvent.keyboard("c");
  expect(focused()).toBe("Cranberry");
  // the icon's ligature ("download") is not part of the name
  await userEvent.keyboard("d");
  expect(focused()).toBe("Cranberry");
});

test("Escape and Enter close the menu and hand focus back to the trigger", async () => {
  const onPick = vi.fn();
  const screen = await render(MenuKeys, { onPick });
  const trigger = screen.getByTestId("trigger");

  (trigger.element() as HTMLElement).focus();
  await userEvent.keyboard("{ArrowUp}");
  await expect.poll(focused).toBe("Cranberry");
  await userEvent.keyboard("{Escape}");
  await expect.element(screen.getByRole("menu")).not.toBeInTheDocument();
  expect(document.activeElement).toBe(trigger.element());

  await userEvent.keyboard("{ArrowDown}{Enter}");
  expect(onPick).toHaveBeenCalledWith("apple");
  await expect.element(screen.getByRole("menu")).not.toBeInTheDocument();
  expect(document.activeElement).toBe(trigger.element());
});

test("a select opens onto its chosen row, announced as checked", async () => {
  const screen = await render(SelectFixture);

  (screen.getByRole("button", { name: "Newest" }).element() as HTMLElement).focus();
  await userEvent.keyboard("{ArrowDown}");
  const chosen = screen.getByRole("menuitemradio", { name: "Newest" });

  await expect.element(chosen).toHaveAttribute("aria-checked", "true");
  await expect.poll(() => document.activeElement).toBe(chosen.element());

  await userEvent.keyboard("{ArrowDown}{Enter}");
  await expect.element(screen.getByTestId("bound")).toHaveTextContent("popular");
});

test("tabs are one Tab stop; arrows move and choose, skipping disabled tabs", async () => {
  const screen = await render(TabsFixture);
  const a = screen.getByRole("tab", { name: "A" });

  await expect.element(a).toHaveAttribute("tabindex", "0");
  await expect.element(screen.getByRole("tab", { name: "C" })).toHaveAttribute("tabindex", "-1");

  (a.element() as HTMLElement).focus();
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(screen.getByTestId("value")).toHaveTextContent("c");
  expect(focused()).toBe("C");
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(screen.getByTestId("value")).toHaveTextContent("a");
  await userEvent.keyboard("{End}");
  await expect.element(screen.getByTestId("value")).toHaveTextContent("c");
});
