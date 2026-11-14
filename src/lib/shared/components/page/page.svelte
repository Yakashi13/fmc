<script lang="ts">
  // A routed page's frame: an optional fixed header over one scrolling body.
  //
  // On a phone the tab bar is translucent glass (app-nav) and the layout reserves a strip for
  // it under the page, so nothing would ever scroll beneath it. This stretches the page into
  // that strip and pads the scroller by the same amount: content slides under the glass, and
  // the last row still clears the bar.
  import type { Snippet } from "svelte";

  interface Props {
    header?: Snippet;
    children?: Snippet;
  }
  const { header, children }: Props = $props();
</script>

<div class="page">
  {#if header}<header>{@render header()}</header>{/if}
  <main>{@render children?.()}</main>
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  header {
    flex: none;
    border-bottom: 1px solid oklch(from var(--color-text) l c h / 10%);
  }
  main {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }
  @media (max-width: 767px) {
    .page {
      height: calc(100% + var(--nav-bar-height) + var(--safe-area-bottom));
      margin-block-end: calc(-1 * (var(--nav-bar-height) + var(--safe-area-bottom)));
    }
    main {
      padding-block-end: calc(var(--nav-bar-height) + var(--safe-area-bottom));
    }
  }
</style>
