// The titles and descriptions crawlers and link unfurlers see, in one place.
//
// Two very different runtimes read this file: the pages, which set document.title through
// <svelte:head>, and scripts/seo.ts, which bakes the same strings into the HTML on disk at build
// time (a node script, hence the plain constants and no imports — nothing here may reach for
// $lib, $app or the DOM). Google renders the JS and indexes the runtime title, an unfurler only
// ever sees the baked one; they have to agree.

/** What the app claims to support — same pair as the watch sheet and the root title. */
export const DEVICE = "CMF Watch Pro 2 & Pro 3";
export const SITE_NAME = "FMC";

export const siteTitle = () => `FMC — watch faces, apps and firmware for CMF watches`;
export const siteDesc = () =>
  `Explore watch faces, apps and firmware for CMF watches. Create watch faces in the editor and install compatible content from your browser.`;

export const faceTitle = (name: string) => `${name} — watchface for the ${DEVICE}`;
/** The creator's own words when there are any; otherwise something a search result can use. */
export const faceDesc = (description: string, by?: string) =>
  description.trim() ||
  `${by ? `A watchface by ${by}. ` : ""}Install it on your ${DEVICE} straight from the browser — no phone app.`;

export const creatorTitle = (name: string) => `${name} — watchfaces on FMC`;
export const creatorDesc = (name: string) =>
  `Watchfaces by ${name} for the ${DEVICE}, free to install from the browser.`;
