<script lang="ts">
  // A row of small facts — a number or a word over its label. Splits the width evenly, so
  // three or four of them read as one strip on a phone instead of a tall list of rows.
  interface Props {
    items: { label: string; value: string | number }[];
  }
  const { items }: Props = $props();
</script>

<dl class="stats">
  {#each items as item (item.label)}
    <div>
      <dt>{item.label}</dt>
      <dd>{item.value}</dd>
    </div>
  {/each}
</dl>

<style>
  .stats {
    display: flex;
    gap: 0.25rem;
    margin: 0;

    div {
      display: flex;
      flex: 1;
      min-width: 0;
      flex-direction: column-reverse;
      gap: 0.125rem;
      padding: 0.625rem 0.75rem;
      background: oklch(from var(--color-text) l c h / 6%);
      border-radius: calc(var(--border-radius) / 2);

      &:first-child {
        border-start-start-radius: var(--border-radius);
        border-end-start-radius: var(--border-radius);
      }
      &:last-child {
        border-start-end-radius: var(--border-radius);
        border-end-end-radius: var(--border-radius);
      }
    }
    dt {
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: oklch(from var(--color-text) l c h / 55%);
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    dd {
      margin: 0;
      font-size: 1.125rem;
      font-weight: 500;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
</style>
