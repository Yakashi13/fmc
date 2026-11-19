<script lang="ts">
  import { Text } from "$lib/shared/components/text";
  import type { Snippet } from "svelte";
  interface Props {
    label?: string;
    error?: string;
    hint?: string;
    children?: Snippet;
  }
  const { label, error, hint, children }: Props = $props();
</script>

<label class="field">
  {#if label}<Text variant="label" tone="muted">{label}</Text>{/if}
  {@render children?.()}
  {#if error}
    <Text variant="caption" tone="error">{error}</Text>
  {:else if hint}
    <Text variant="caption" tone="muted">{hint}</Text>
  {/if}
</label>

<style>
  /* a mono small-caps label over the control, a hint or an error under it */
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
  }
</style>
