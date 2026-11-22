import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const STATIC = join(dirname(fileURLToPath(import.meta.url)), "..", "static");
const inline = async (path: string, mime: string) =>
  `data:${mime};base64,${(await readFile(join(STATIC, path))).toString("base64")}`;
const source = (await readFile(join(STATIC, "branding/fmc-community.svg"), "utf8"))
  .replace(/<rect\b[^>]*\/>/, "")
  .replace(/\s(?:width|height)="512"/g, "");
const color = process.env.OG_WATCH_COLOR ?? "dark-grey";

if (!["dark-grey", "orange", "green"].includes(color))
  throw new Error("Unsupported OG watch color");
const output = process.env.OG_OUTPUT ?? join(STATIC, "og-default.png");
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL });

try {
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });

  await page.setContent(source);
  const bounds = await page.locator("svg").evaluate((svg) => {
    const { x, y, width, height } = (svg as SVGSVGElement).getBBox();

    return `${x - 2} ${y - 2} ${width + 4} ${height + 4}`;
  });
  const mark = source.replace(/viewBox="[^"]+"/, `viewBox="${bounds}"`);
  const [font, watch] = await Promise.all([
    inline("fonts/geist.woff2", "font/woff2"),
    inline(`frames/watch-3-pro-${color}.webp`, "image/webp"),
  ]);

  await page.setContent(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
  <style>
    @font-face { font-family: Geist; src: url("${font}"); font-weight: 100 900; }
    * { box-sizing: border-box; margin: 0; }
    html, body { inline-size: 1200px; block-size: 630px; }
    body { background: #000; color: #fafafa; font-family: Geist, sans-serif; }
    main { position: relative; isolation: isolate; display: grid; grid-template-columns: 680px minmax(0, 1fr); block-size: 100%; padding-inline: 152px 72px; overflow: clip; }
    .copy { position: relative; display: flex; flex-direction: column; justify-content: center; align-items: start; padding-block: 72px; z-index: 1; }
    .mark { inline-size: 230px; }
    .mark svg { display: block; inline-size: 100%; block-size: auto; }
    h1 { margin-block-start: 44px; font-size: 60px; font-weight: 550; line-height: 1.12; letter-spacing: -2px; }
    p { margin-block-start: 24px; color: #929292; font-size: 26px; line-height: 1.4; }
    .art { position: absolute; inset: 0; z-index: 0; mask-image: linear-gradient(90deg, transparent 54%, #000 80%); }
    .art img { display: block; position: absolute; inline-size: 1120px; block-size: 1120px; object-fit: contain; inset-inline-start: 565px; inset-block-start: -245px; opacity: .23; }
  </style></head><body><main>
    <section class="copy"><div class="mark">${mark}</div>
      <h1>Watch faces.<br>Apps &amp; firmware.</h1>
      <p>Explore, create and install.</p>
    </section>
    <div class="art" aria-hidden="true"><img src="${watch}" alt=""></div>
  </main></body></html>`,
    { waitUntil: "load" },
  );
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode()));
  });
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );

  const textFits = await page
    .locator("h1")
    .evaluate((element) => element.scrollWidth <= element.clientWidth);

  if (!textFits) throw new Error("OG headline overflows its column");
  const png = await page.screenshot({ type: "png" });

  await writeFile(output, png);
  console.log(
    `static/og-default.png: 1200x630, ${(png.length / 1024).toFixed(1)} kB; local fonts and artwork only`,
  );
} finally {
  await browser.close();
}
