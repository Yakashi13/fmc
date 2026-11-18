<script lang="ts">
  // The privacy policy of the site and of FMC Companion, which links here from the App Store and TestFlight.
  // The same text is companion's PRIVACY.md (github.com/fmctools/companion); change both together.
  import { marked } from "marked";
  import source from "./privacy.md?raw";

  // our own file, so {@html} is safe
  const html = marked.parse(source, { async: false });
</script>

<svelte:head>
  <title>Privacy — FMC</title>
  <meta name="description" content="What fmc.tools and the FMC Companion app collect, and what they don't." />
</svelte:head>

<div class="page">
  <article>{@html html}</article>
</div>

<style>
  .page {
    height: 100%;
    overflow-y: auto;
  }
  article {
    max-width: 44rem;
    margin: 0 auto;
    padding: 2rem 1rem 4rem;
  }
  article :global {
    h1 {
      margin: 0 0 0.75rem;
      font-family: var(--font-display);
      font-size: 1.75rem;
    }
    h1 + p {
      color: oklch(from var(--color-text) l c h / 75%);
    }
    h2 {
      margin: 2rem 0 0.75rem;
      font-size: 1.25rem;
    }
    h3 {
      margin: 1.5rem 0 0.5rem;
      font-size: 1.0625rem;
    }
    p {
      margin: 0 0 0.75rem;
      line-height: 1.6;
    }
    ul {
      margin: 0 0 0.75rem;
      padding-left: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      line-height: 1.6;
    }
    li::marker {
      color: oklch(from var(--color-text) l c h / 45%);
    }
    code {
      font-family: var(--font-mono);
      font-size: 0.875em;
    }
    a {
      color: var(--color-accent);
      text-decoration-color: oklch(from var(--color-accent) l c h / 45%);
    }
  }
</style>
