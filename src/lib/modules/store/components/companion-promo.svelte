<script lang="ts">
  // The one-time banner for the phone app, over the watchface shelf. See companion-promo.model.
  import { Icon } from "$lib/shared/components/icon";
  import { companionPromoModel } from "../model";

  const { $promoVisible: visible, promoDismissed } = companionPromoModel;
</script>

{#if $visible}
  <aside class="promo">
    <a href="/companion" onclick={() => promoDismissed()}>
      <span class="glyph"><Icon name="smartphone" size={22} /></span>
      <span class="text">
        <strong>FMC Companion mobile app</strong>
        <span>Watch faces, watch apps and firmware from your phone. Android beta, iOS soon.</span>
      </span>
    </a>
    <button type="button" aria-label="Dismiss" onclick={() => promoDismissed()}>
      <Icon name="close" size={20} />
    </button>
  </aside>
{/if}

<style>
  .promo {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    /* the shelf's own gutter: watchface-list pads by 1rem, 0.75rem on a phone */
    margin: 1rem 1rem 0;
    padding: 0.5rem 0.5rem 0.5rem 0.75rem;
    border: 1px solid oklch(from var(--color-accent) l c h / 40%);
    border-radius: var(--border-radius);
    background: oklch(from var(--color-accent) l c h / 6%);
  }
  @media (max-width: 767px) {
    .promo {
      margin: 0.75rem 0.75rem 0;
    }
  }
  a {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 0.75rem;
    min-width: 0;
    color: inherit;
    text-decoration: none;
  }
  .glyph {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: var(--color-accent);
    color: var(--color-on-accent);
  }
  .text {
    display: flex;
    flex-direction: column;
    min-width: 0;

    span {
      font-size: 0.75rem;
      color: oklch(from var(--color-text) l c h / 60%);
    }
  }
  button {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: oklch(from var(--color-text) l c h / 55%);
    cursor: pointer;

    @media (hover: hover) {
      &:hover {
        background: oklch(from var(--color-text) l c h / 8%);
      }
    }
  }
</style>
