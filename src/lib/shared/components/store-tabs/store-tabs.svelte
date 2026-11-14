<script lang="ts">
  // The store's sections, as the page's own title: every shelf page opens with this row, and
  // the section you are on is the one in full ink. They are links — each section is a route.
  import { page } from "$app/state";

  const path = $derived(page.url.pathname);
  // the community panel shares the root route with the watchfaces (?community)
  const community = $derived(path === "/" && page.url.searchParams.has("community"));

  const sections = $derived([
    {
      // "Faces", not "Watchfaces": four titles have to fit one row on a phone
      title: "Faces",
      href: "/",
      active: !community && (path === "/" || path.startsWith("/market") || path.startsWith("/my")),
    },
    { title: "Apps", href: "/apps", active: path.startsWith("/apps") },
    { title: "Firmware", href: "/firmware", active: path.startsWith("/firmware") },
    { title: "Community", href: "/?community", active: community },
  ]);
</script>

<nav class="store-tabs" aria-label="Store sections">
  {#each sections as section (section.href)}
    <a href={section.href} aria-current={section.active ? "page" : undefined}>{section.title}</a>
  {/each}
</nav>

<style>
  .store-tabs {
    display: flex;
    align-items: baseline;
    gap: 1.125rem;
    min-width: 0;
    /* four titles don't fit a 320px phone: the row scrolls, without a scrollbar of its own */
    overflow-x: auto;
    scrollbar-width: none;
  }
  a {
    flex: none;
    font-family: var(--font-display);
    font-stretch: 62.5%;
    font-size: 1.5rem;
    line-height: 2.5rem;
    white-space: nowrap;
    text-decoration: none;
    color: oklch(from var(--color-text) l c h / 40%);
    transition: color 0.15s ease;

    @media (hover: hover) {
      &:hover {
        color: oklch(from var(--color-text) l c h / 70%);
      }
    }
    &:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
      border-radius: 0.25rem;
    }
    &[aria-current="page"] {
      color: var(--color-text);
    }
  }
</style>
