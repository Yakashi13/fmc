<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    type?: "submit" | "reset" | "button";
    kind?: "primary" | "secondary" | "ghost" | "danger";
    /** `large` is a page's main action (the store's detail pages); `small` sits on a dense
     *  surface (the editor's toolbar and panels); everything else is default */
    size?: "small" | "default" | "large";
    class?: string;
    /** icon-only, a field tall and square-cornered like one: a tool that sits beside a field */
    square?: boolean;
    disabled?: boolean;
    href?: string;
    /** With `href`: leave the app — open in a new tab. */
    external?: boolean;
    onClick?: (e: MouseEvent) => void;
    children?: Snippet;
  }
  const {
    type = "button",
    kind = "primary",
    size = "default",
    class: className,
    square = false,
    disabled,
    href,
    external,
    onClick,
    children,
  }: Props = $props();
</script>

<svelte:element
  this={href ? "a" : "button"}
  class="btn {size === 'small'
    ? 'type-button-small'
    : 'type-button'} kind__{kind} size__{size} {className}"
  class:square
  href={disabled ? undefined : href}
  target={href && external ? "_blank" : undefined}
  rel={href && external ? "noopener noreferrer" : undefined}
  type={href ? undefined : type}
  disabled={href ? undefined : disabled}
  aria-disabled={href && disabled ? "true" : undefined}
  role={href ? "link" : "button"}
  onclick={onClick}
>
  {@render children?.()}
</svelte:element>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border: none;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    text-decoration: none;
    /* a pill — half its own height, set per size below, so the corner can animate — that
       squares off while pressed and springs back (Material 3's shape morph) */
    border-radius: calc(var(--h) / 2);
    height: var(--h);
    color: var(--color, var(--color-text));
    background-color: oklch(from var(--color, var(--color-text)) l c h / 10%);
    transition:
      border-radius var(--spring-transition),
      background-color 0.2s ease;

    @media (hover: hover) {
      &:hover:not(:disabled, [aria-disabled="true"]) {
        background-color: oklch(from var(--color, var(--color-text)) l c h / 16%);
      }
    }
    &:active:not(:disabled, [aria-disabled="true"]) {
      border-radius: min(0.75rem, calc(var(--h) / 4));
      transition-duration: 0.12s;
    }
    &:focus-visible {
      outline: none;
      box-shadow: 0 0 0 4px oklch(from var(--color-text) l c h / 25%);
    }
    &:disabled,
    &[aria-disabled="true"] {
      opacity: 0.5;
      cursor: default;
    }
  }
  /* a cursor, not a thumb, from md up — so a notch tighter than the phone's sizes below */
  .size__default {
    --h: 2.5rem;
    padding: 0 0.875rem;

    & :global(.icon) {
      --icon-size: 1.25rem;
    }
  }
  .size__small {
    --h: 2rem;
    gap: 0.375rem;
    padding: 0 0.75rem;

    & :global(.icon) {
      --icon-size: 1.125rem;
    }
  }
  .size__large {
    --h: 3rem;
    padding: 0 1.25rem;
  }
  /* a thumb, not a cursor: every size clears the 44px touch target, the main action gets 56px */
  @media (max-width: 767px) {
    .size__small {
      --h: 2.5rem;
    }
    .size__default {
      --h: 3rem;
      padding: 0 1.25rem;
    }
    .size__large {
      --h: 3.5rem;
      padding: 0 1.75rem;
    }
  }

  /* icon-only, a field tall: square corners like the field beside it, a notch tighter pressed */
  .btn.square {
    --h: var(--control-height);
    width: var(--h);
    padding: 0;
    border-radius: var(--border-radius);

    & :global(.icon) {
      --icon-size: 1.25rem;
    }
    &:active:not(:disabled, [aria-disabled="true"]) {
      border-radius: calc(var(--border-radius) / 2);
    }
  }

  /* the main action is ink, not colour: the accent is kept for signals (a dot, a ring) */
  .kind__primary {
    background-color: var(--color-text);
    color: var(--color-background);

    @media (hover: hover) {
      &:hover:not(:disabled, [aria-disabled="true"]) {
        background-color: oklch(from var(--color-text) l c h / 85%);
      }
    }
  }
  .kind__secondary {
    --color: var(--color-text);
  }
  .kind__ghost {
    --color: var(--color-text);
    background-color: transparent;
  }
  .kind__danger {
    --color: var(--color-error);
  }
</style>
