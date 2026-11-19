<script lang="ts">
  import type { Snippet } from "svelte";
  interface Props {
    danger?: boolean;
    /** renders the item as a link — for actions the browser should own (download, open) */
    href?: string;
    /** Keycaps for the shortcut that runs the same action, already in the platform's alphabet.
     *  The caller owns the keymap — this only draws what it is handed. */
    keys?: readonly string[];
    disabled?: boolean;
    /** a row of a single-choice list (select/): announced as a radio item, and the one the menu
     *  opens onto */
    checked?: boolean;
    /** the row doesn't close the menu: it swaps what the menu shows (into a submenu, or back) */
    stay?: boolean;
    onClick?: () => void;
    children?: Snippet;
  }
  const { danger, href, keys, disabled, checked, stay, onClick, children }: Props = $props();
  // rows are reached by the arrows, not by Tab (the menu's roving focus)
  const role = $derived(checked === undefined ? "menuitem" : "menuitemradio");
</script>

{#snippet label()}
  {@render children?.()}
  {#if keys?.length}
    <span class="keys"
      >{#each keys as k (k)}<kbd class="type-label">{k}</kbd>{/each}</span
    >
  {/if}
{/snippet}

{#if href}
  <a
    class="item type-body"
    class:danger
    class:radio={checked !== undefined}
    class:on={checked}
    {role}
    aria-checked={checked}
    tabindex="-1"
    {href}
    onclick={onClick}>{@render label()}</a
  >
{:else}
  <button
    type="button"
    class="item type-body"
    class:danger
    class:radio={checked !== undefined}
    class:on={checked}
    {role}
    aria-checked={checked}
    data-stay={stay ? "" : undefined}
    tabindex="-1"
    {disabled}
    onclick={onClick}>{@render label()}</button
  >
{/if}

<style>
  .item {
    display: flex;
    text-decoration: none;
    align-items: center;
    /* a row's glyph is one size and steps back, whatever the caller asked for */
    --icon-size: 1.25rem;
    gap: 0.75rem;
    border: none;
    background: transparent;
    color: var(--color-text);
    cursor: pointer;
    /* a row is a field tall: the dense inspector's menus come out as dense as its fields */
    min-height: var(--control-height);
    /* the menu is a capped flex column: a long list would squeeze its rows down to that
       min-height and a label wrapped onto two lines would spill over the next row — it scrolls
       instead */
    flex-shrink: 0;
    padding: 0.25rem 0.875rem;

    /* under a finger a row is never smaller than a touch target */
    @media (max-width: 767px) {
      min-height: max(2.75rem, var(--control-height));
    }
    /* concentric with the menu: its radius less its padding */
    border-radius: 0.875rem;
    text-align: start;

    outline: none;

    :global(.icon) {
      flex: none;
      color: oklch(from currentColor l c h / 60%);
    }

    /* focus is the current row — the arrows move it, and so does the pointer (see menu.svelte) */
    &:focus {
      background: oklch(from var(--color-text) l c h / 8%);
    }
    @media (hover: hover) {
      &:hover:not(:disabled) {
        background: oklch(from var(--color-text) l c h / 8%);
      }
    }
    &:disabled {
      opacity: 0.45;
      cursor: default;
    }
  }
  .danger {
    color: var(--color-error);
  }
  /* a single-choice row: the ones you didn't pick step back; the one you did keeps full ink
     and is closed by an accent dot */
  .radio {
    justify-content: space-between;
    gap: 1rem;
    color: oklch(from var(--color-text) l c h / 60%);

    &.on {
      color: var(--color-text);

      &::after {
        content: "";
        flex: none;
        width: 0.375rem;
        height: 0.375rem;
        border-radius: 50%;
        background: var(--color-accent);
      }
    }
  }
  /* pushed to the far edge, and it never squeezes the label */
  .keys {
    display: flex;
    flex: none;
    gap: 0.125rem;
    margin-inline-start: auto;
    padding-inline-start: 1rem;
  }
  kbd {
    color: oklch(from var(--color-text) l c h / 55%);
  }
</style>
