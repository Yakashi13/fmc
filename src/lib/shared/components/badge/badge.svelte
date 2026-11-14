<script lang="ts">
  import type { Snippet } from "svelte";
  interface Props {
    // `quiet` — a tinted badge instead of the accent one, for a label that sits on every card
    // (the device) rather than calling out an exception (Draft/Published)
    quiet?: boolean;
    // `warn` — the error tint, for a label the reader should stop at (an untested firmware)
    warn?: boolean;
    children?: Snippet;
  }
  const { quiet = false, warn = false, children }: Props = $props();
</script>

<span class="badge" class:quiet class:warn>{@render children?.()}</span>

<style>
  .badge {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0 0.625rem;
    height: 1.3rem;
    /* its own face even inside a heading, which would otherwise hand it the display serif */
    font-family: var(--font-family);
    font-stretch: normal;
    font-size: 0.7rem;
    font-weight: 500;
    border-radius: calc(var(--border-radius) / 2);
    color: var(--color-text);
    background: var(--color-accent);

    &.quiet {
      color: oklch(from var(--color-text) l c h / 55%);
      background: oklch(from var(--color-text) l c h / 6%);
    }
    &.warn {
      color: var(--color-error);
      background: oklch(from var(--color-error) l c h / 12%);
    }
  }
</style>
