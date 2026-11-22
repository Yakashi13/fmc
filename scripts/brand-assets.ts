import { readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL });
const page = await browser.newPage();
const mark = await readFile("static/branding/fmc-community.svg", "utf8");

await writeFile("static/icons/icon.svg", mark);
// Keep every part of the supplied mark; remove only its tile and tighten the surrounding canvas.
const freeMark = mark
  .replace(/<rect\b[^>]*\/>/, "")
  .replace('viewBox="0 0 512 512"', 'viewBox="44 44 424 424"');

for (const [name, foreground] of [
  ["light", "#010101"],
  ["dark", "#FAFAFA"],
  ["neutral", "#202020"],
]) {
  let variant = freeMark.replaceAll('fill="#FAFAFA"', 'fill="' + foreground + '"');
  // The non-themed fallback needs an edge that survives both light and dark host surfaces.
  if (name === "neutral")
    variant = variant.replaceAll(
      "<path ",
      '<path stroke="#FAFAFA" stroke-width="4" paint-order="stroke fill" ',
    );
  await writeFile(`static/icons/favicon-${name}.svg`, variant);
}

// Run from the repository root: node scripts/brand-assets.ts.
for (const [name, size, pad] of [
  ["icon-192.png", 192, 0],
  ["icon-512.png", 512, 0],
  ["icon-maskable-512.png", 512, 32],
  ["apple-touch-icon.png", 180, 0],
  ["favicon-32.png", 32, 0],
  ["favicon-96.png", 96, 0],
] as const) {
  await page.setViewportSize({ width: size, height: size });
  const artwork = name.startsWith("favicon-")
    ? await readFile("static/icons/favicon-neutral.svg", "utf8")
    : mark;

  await page.setContent(
    `<style>*{box-sizing:border-box}body{margin:0;background:${pad ? "#010101" : "transparent"};padding:${pad}px}svg{display:block;width:100%;height:100%}</style>${artwork}`,
  );
  if (name === "favicon-32.png") {
    const png = await page.screenshot({ omitBackground: true });
    const header = Buffer.alloc(22);

    header.writeUInt16LE(1, 2);
    header.writeUInt16LE(1, 4);
    header[6] = header[7] = 32;
    header.writeUInt16LE(1, 10);
    header.writeUInt16LE(32, 12);
    header.writeUInt32LE(png.length, 14);
    header.writeUInt32LE(22, 18);
    await writeFile("static/favicon.ico", Buffer.concat([header, png]));
  } else if (name === "favicon-96.png") {
    await page.screenshot({ path: "static/favicon.png", omitBackground: true });
  } else {
    await page.screenshot({ path: `static/icons/${name}` });
  }
}
await browser.close();
