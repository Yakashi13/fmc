// Prose renders a record's markdown through {@html}, and the record comes from the database.
// So what it lets through is the contract: markdown becomes tags, raw HTML stays text, and a
// link can only point at the web.
import { test, expect } from "vitest";
import { render } from "vitest-browser-svelte";
import { Prose } from "$lib/shared/components/prose";

test("markdown becomes markup", async () => {
  const screen = await render(Prose, { source: "## Controls\n\n- **Tap** to finish" });

  expect(screen.container.querySelector("h2")?.textContent).toBe("Controls");
  expect(screen.container.querySelector("li strong")?.textContent).toBe("Tap");
});

test("raw HTML is shown as text, not injected", async () => {
  const screen = await render(Prose, {
    source:
      'before <img src=x onerror="window.pwned = 1"> after\n\n<script>window.pwned = 1</script>',
  });

  expect(screen.container.querySelector("img, script")).toBeNull();
  expect(screen.container.textContent).toContain("<script>");
  expect((window as { pwned?: number }).pwned).toBeUndefined();
});

test("a link that isn't to the web is defused", async () => {
  const screen = await render(Prose, {
    source: "[bad](javascript:alert(1)) [good](https://example.com) [local](/firmware)",
  });
  const hrefs = [...screen.container.querySelectorAll("a")].map((a) => a.getAttribute("href"));

  expect(hrefs).toEqual(["#", "https://example.com", "/firmware"]);
});

test("a bare URL becomes a link that opens in a new tab", async () => {
  const screen = await render(Prose, { source: "Fonts from https://example.com/fonts, thanks!" });
  const a = screen.container.querySelector("a");

  expect(a?.getAttribute("href")).toBe("https://example.com/fonts");
  expect(a?.getAttribute("target")).toBe("_blank");
  expect(a?.getAttribute("rel")).toBe("noopener");
});

test("user text keeps its line breaks and its links are nofollow", async () => {
  const screen = await render(Prose, {
    source: "line one\nline two https://example.com",
    ugc: true,
  });

  expect(screen.container.querySelector("br")).not.toBeNull();
  expect(screen.container.querySelector("a")?.getAttribute("rel")).toBe("nofollow ugc noopener");
});
