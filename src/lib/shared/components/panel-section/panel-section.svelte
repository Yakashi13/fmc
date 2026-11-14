<script lang="ts">
  // One titled group in a side panel: a small caps heading over its controls, with a hairline
  // between it and the group above. A panel reads as a stack of these instead of one long
  // column of unrelated fields.
  //
  // A section whose body renders nothing hides itself, heading and all — the inspector's
  // sections depend on the selected layer's kind, and an empty heading would be noise.
  import type { Snippet } from "svelte";

  interface Props {
    title: string;
    children?: Snippet;
  }
  const { title, children }: Props = $props();
</script>

<section class="panel-section">
  <h3>{title}</h3>
  <div class="body">{@render children?.()}</div>
</section>

<style>
  .panel-section {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    padding-block: 0.875rem;

    &:not(:has(> .body > *)) {
      display: none;
    }
    & + :global(.panel-section) {
      border-top: 1px solid oklch(from var(--color-text) l c h / 10%);
    }
    &:first-child {
      padding-top: 0.25rem;
    }
  }
  h3 {
    margin: 0;
    font-family: var(--font-mono);
    font-stretch: normal;
    font-size: 0.6875rem;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: oklch(from var(--color-text) l c h / 55%);
  }
  .body {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }
</style>
