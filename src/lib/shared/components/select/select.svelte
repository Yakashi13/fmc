<script lang="ts">
  // A select built on Menu, so the dropdown is the same surface as every other popup in the
  // app — and, where anchor positioning exists, lives in the top layer instead of being clipped
  // by a panel's scroll container. The chosen row is the one in full ink, closed by an accent dot.
  import { Icon } from "$lib/shared/components/icon";
  import { Menu, MenuItem } from "$lib/shared/components/menu";

  interface Props {
    value?: string;
    // `short` — what the trigger shows when the full label only makes sense in the open list
    options: { value: string; label: string; short?: string }[];
    disabled?: boolean;
    onChange?: (value: string) => void;
  }
  let { value = $bindable(""), options, disabled, onChange }: Props = $props();

  const current = $derived(options.find((o) => o.value === value));

  function pick(v: string) {
    value = v;
    onChange?.(v);
  }
</script>

<span class="field">
  <Menu align="start">
    {#snippet trigger({ open, toggle })}
      <button type="button" class="select type-body" class:open {disabled} onclick={toggle}>
        <span class="label">{current?.short ?? current?.label ?? ""}</span>
        <Icon name="chevron_right" size={20} class="chevron" />
      </button>
    {/snippet}
    {#each options as opt (opt.value)}
      <MenuItem checked={opt.value === value} onClick={() => pick(opt.value)}>{opt.label}</MenuItem>
    {/each}
  </Menu>
</span>

<style>
  /* the Menu root is an inline box; the select fills its field like the native one did */
  .field,
  .field :global(.root) {
    display: flex;
    width: 100%;
  }
  /* the trigger keeps the native select's box, so nothing around it moves — see input/ */
  .select {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    height: var(--control-height);
    padding: 0 0.875rem;
    color: var(--color-text);
    text-align: start;
    background: oklch(from var(--color-text) l c h / 7%);
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    outline: none;
    transition:
      box-shadow 0.15s ease,
      background-color 0.15s ease;

    @media (hover: hover) {
      &:hover:not(:disabled) {
        background: oklch(from var(--color-text) l c h / 10%);
      }
    }
    &:focus-visible {
      /* one quiet line on the box's own edge and a step lighter fill — no halo around it */
      background: oklch(from var(--color-text) l c h / 12%);
      box-shadow: inset 0 0 0 1px oklch(from var(--color-text) l c h / 35%);
    }

    &:disabled {
      opacity: 0.5;
      cursor: default;
    }
  }
  .label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* one chevron glyph, pointed down; it turns over while the list is open */
  .select :global(.chevron) {
    flex: none;
    rotate: 90deg;
    color: oklch(from var(--color-text) l c h / 55%);
    transition: rotate 0.2s ease;
  }
  .select.open {
    background: oklch(from var(--color-text) l c h / 12%);

    :global(.chevron) {
      rotate: -90deg;
    }
  }
</style>
