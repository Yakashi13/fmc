<script lang="ts">
  // One line the app has to say about what just happened: a tinted tile with a glyph. `error`
  // is the red one (something failed and the user should stop at it), `info` the neutral one.
  import type { Snippet } from "svelte";
  import { Icon, type IconName } from "$lib/shared/components/icon";

  interface Props {
    tone?: "info" | "error";
    icon?: IconName;
    /** a second line under the first, quieter: what to do about it */
    detail?: Snippet;
    children?: Snippet;
  }
  const { tone = "info", icon, detail, children }: Props = $props();
</script>

<div class="notice type-small tone-{tone}" role={tone === "error" ? "alert" : "status"}>
  <Icon name={icon ?? (tone === "error" ? "error" : "info")} size={20} />
  <span class="lines">
    <span class="type-button-small">{@render children?.()}</span>
    {#if detail}<span class="detail">{@render detail()}</span>{/if}
  </span>
</div>

<style>
  .notice {
    display: flex;
    align-items: flex-start;
    gap: 0.625rem;
    margin: 0;
    padding: 0.75rem 0.875rem;
    border-radius: var(--border-radius);
    overflow-wrap: anywhere;

    :global(.icon) {
      flex: none;
      /* the glyph's middle on the first line's middle */
      margin-top: 0.0625rem;
    }
  }
  .lines {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }
  .detail {
    opacity: 0.8;
  }
  .tone-info {
    color: oklch(from var(--color-text) l c h / 75%);
    background: oklch(from var(--color-text) l c h / 7%);

    :global(.icon) {
      color: oklch(from var(--color-text) l c h / 55%);
    }
  }
  .tone-error {
    color: var(--color-error);
    background: oklch(from var(--color-error) l c h / 12%);
  }
</style>
