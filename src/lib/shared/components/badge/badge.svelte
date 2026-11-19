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

<span class="badge type-label" class:quiet class:warn>{@render children?.()}</span>

<style>
  /* a mono label in a hairline pill; the default one is led by an accent dot */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0 0.5rem;
    height: 1.375rem;
    white-space: nowrap;
    border-radius: 625rem;
    color: var(--color-text);
    border: 1px solid oklch(from var(--color-text) l c h / 20%);

    &::before {
      content: "";
      width: 0.375rem;
      height: 0.375rem;
      border-radius: 50%;
      background: var(--color-accent);
    }
    &.quiet {
      color: oklch(from var(--color-text) l c h / 55%);
      border-color: oklch(from var(--color-text) l c h / 12%);

      &::before {
        content: none;
      }
    }
    &.warn {
      color: var(--color-error);
      border-color: oklch(from var(--color-error) l c h / 40%);

      &::before {
        background: var(--color-error);
      }
    }
  }
</style>
