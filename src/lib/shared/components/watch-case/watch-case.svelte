<script lang="ts">
  // A dial shown the way it will be worn: inside the watch. The watch is the front render of
  // a CMF Watch Pro 2 (static/frames/, the same artwork the cmf-watch-utils web emulator
  // frames its screen with), and the children are laid over its display, clipped to the glass.
  //
  // The component's own box is the CASE — the metal disc — so a caller sizes "the watch"
  // without doing arithmetic on the picture. The rest of the render (the crown, the lugs and
  // the strap) hangs outside that box and takes no space: give it room, or let a parent clip it.
  //
  // The numbers below locate things in the 1144px render: the case is 62.76% of its width, the
  // black bezel 51.75%, and the panel 94% of the bezel, centred a hair under the middle. They
  // are the emulator's own (--bezel-width, --bezel-center, --screen-width in its style.css).
  import type { Snippet } from "svelte";

  interface Props {
    children?: Snippet;
  }
  const { children }: Props = $props();
</script>

<div class="case">
  <img class="render" src="/frames/watch-pro-2-dark-grey.webp" alt="" draggable="false" />
  <div class="bezel">
    <div class="glass">{@render children?.()}</div>
  </div>
</div>

<style>
  .case {
    --case: 0.6276; /* case diameter / render width */
    --bezel: 0.5175; /* bezel diameter / render width */
    --center-y: 0.50175; /* the display's centre, down the render */

    position: relative;
    width: 100%;
    aspect-ratio: 1;
  }
  .render {
    position: absolute;
    top: 50%;
    left: 50%;
    width: calc(100% / var(--case));
    max-width: none;
    /* the render's display centre lands on the box's centre */
    transform: translate(-50%, calc(-100% * var(--center-y)));
    pointer-events: none;
    user-select: none;
  }
  /* covers the watchface baked into the render: the black ring under the glass */
  .bezel {
    position: absolute;
    top: 50%;
    left: 50%;
    display: grid;
    place-items: center;
    width: calc(100% * var(--bezel) / var(--case));
    aspect-ratio: 1;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: oklch(0 0 0);
  }
  .glass {
    position: relative;
    width: 94%;
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 50%;
    background: oklch(0 0 0);
  }
</style>
