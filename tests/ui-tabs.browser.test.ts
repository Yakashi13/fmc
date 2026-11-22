import { test, expect } from "vitest";
import { render } from "vitest-browser-svelte";
import { Tabs } from "$lib/shared/components/tabs";

test("route tabs settle their measured thumb without an effect loop", async () => {
  const screen = await render(Tabs, {
    items: [
      { value: "faces", label: "Faces", href: "/" },
      { value: "apps", label: "Apps", href: "/apps" },
    ],
    value: "apps",
    label: "Store sections",
  });

  await expect.element(screen.getByRole("navigation", { name: "Store sections" })).toBeVisible();
  await expect
    .poll(() => document.querySelector(".tabs .lit")?.classList.contains("ready"))
    .toBe(true);
  await expect
    .element(screen.getByRole("link", { name: "Apps", exact: true }))
    .toHaveAttribute("aria-current", "page");
});
