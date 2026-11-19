<script lang="ts">
  // A row of small facts — a number or a word over its label. Splits the width evenly, so
  // three or four of them read as one strip on a phone instead of a tall list of rows.
  interface Props {
    items: { label: string; value: string | number }[];
  }
  const { items }: Props = $props();

  // a count goes in dot matrix; a word or a version ("1.0.0.73") doesn't read in it
  const isCount = (v: string | number) => /^\d+([.,]\d+)?[kKM]?$/.test(String(v));
</script>

<dl class="stats">
  {#each items as item (item.label)}
    <div>
      <dt class="type-label">{item.label}</dt>
      <dd class={isCount(item.value) ? "type-title" : "type-subtitle type-mono"}>{item.value}</dd>
    </div>
  {/each}
</dl>

<style>
  /* one tile, the facts split by dotted rules: a dot-matrix number over its mono label */
  .stats {
    display: flex;
    margin: 0;
    border-radius: var(--border-radius-tile);
    background: oklch(from var(--color-text) l c h / 7%);

    div {
      display: flex;
      flex: 1;
      min-width: 0;
      flex-direction: column-reverse;
      justify-content: space-between;
      gap: 0.25rem;
      padding: 0.875rem 1rem;

      & + div {
        border-inline-start: 2px dotted oklch(from var(--color-text) l c h / 18%);
      }
    }
    dt {
      color: oklch(from var(--color-text) l c h / 55%);
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    dd {
      margin: 0;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    /* a count and a word share one row height, so the strip doesn't change size with them */
    div {
      min-height: 4.5rem;
    }
  }
</style>
