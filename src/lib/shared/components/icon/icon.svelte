<script module lang="ts">
  /** A Material Symbols Rounded ligature — the whole set is loaded, so any name Google lists
      works as-is: https://fonts.google.com/icons */
  export type IconName = string;
</script>

<script lang="ts">
  interface Props {
    name: IconName;
    size?: number;
    color?: string;
    /** the FILL axis — the liked heart is the solid one */
    fill?: boolean;
    class?: string;
    // the tree panel's chevron is an icon that toggles a node
    onclick?: (event: MouseEvent) => void;
  }

  import { onMount } from "svelte";

  let ready = $state(false);

  onMount(() => {
    let active = true;

    document.fonts
      .load('24px "Material Symbols Rounded"')
      .then((fonts) => {
        if (active) ready = fonts.length > 0;
      })
      .catch(() => {
        /* Keep the icon slot empty when the font is unavailable. */
      });
    return () => {
      active = false;
    };
  });

  const { name, size = 24, color, fill = false, class: cls, onclick }: Props = $props();
</script>

<span
  class="icon {cls ?? ''}"
  class:ready
  style:--size="{size / 16}rem"
  style:font-variation-settings="'FILL' {fill ? 1 : 0}, 'opsz' {size}, 'wght' 400"
  style:color
  aria-hidden="true"
  translate="no"
  {onclick}>{name}</span
>

<style>
  .icon {
    font-family: "Material Symbols Rounded";
    font-size: var(--icon-size, var(--size));
    line-height: 1;
    display: inline-block;
    flex: none;
    width: var(--icon-size, var(--size));
    height: var(--icon-size, var(--size));
    overflow: hidden;
    visibility: hidden;
    &.ready {
      visibility: visible;
    }
    font-weight: normal;
    font-style: normal;
    letter-spacing: normal;
    text-transform: none;
    white-space: nowrap;
    word-wrap: normal;
    direction: ltr;
    -webkit-font-smoothing: antialiased;
    font-feature-settings: "liga";
    user-select: none;
  }
</style>
