<script lang="ts" module>
  // Where a link row's thumb last sat, by the row's label. Each choice of a link row is a route,
  // and the row is mounted anew on every one of them; the new row starts its thumb here and
  // slides to its own tab, so the switch reads the same as in a tablist that never left.
  const last = new Map<string, { l: number; r: number }>();
</script>

<script lang="ts">
  // The app's one segmented control: a pill of mono labels, the chosen one in solid ink. Two
  // shapes of the same control — a tablist of buttons for a choice inside a page (Main / AOD,
  // Properties / Simulator), or a row of links when each choice is a route of its own (the
  // store's sections, see store-tabs/). Its height is --control-height less its own inset, so
  // it lines up with a field beside it and comes out shorter on a dense surface.
  import { Icon } from "../icon";
  import { holdCursor } from "$lib/shared/lib/hold-cursor";

  interface Props {
    /** `icon` makes the tab icon-only; the label stays as its accessible name and tooltip.
     *  `href` makes it a link: the whole row is then navigation, not a tablist */
    items: { value: string; label: string; icon?: string; href?: string; disabled?: boolean }[];
    value: string;
    /** Fill the container and split the width evenly, instead of hugging the labels. */
    full?: boolean;
    /** the row's name for a screen reader, when it is navigation */
    label?: string;
    /** a view-transition-name for the row, so it sits out a page transition (global.css) */
    transition?: string;
    onChange?: (value: string) => void;
  }
  const { items, value, full, label, transition, onChange }: Props = $props();
  const links = $derived(items.some((i) => i.href));

  // The thumb is a mask, not a moving pill: .lit repeats the row in the chosen colours and is
  // clipped to the chosen tab's box, so a switch slides the clip along while the labels stay
  // put. Tabs hug their labels, so the box is measured, and measured again when the row resizes.
  let row = $state<HTMLElement>();
  let box = $state<{ l: number; r: number } | null>(null);
  // no slide on the first paint: the thumb appears where it belongs, then moves from there
  let ready = $state(false);

  $effect(() => {
    if (!row) return;
    const el = row;
    const measure = () => {
      const at = items.findIndex((i) => i.value === value);
      const tab = el.querySelectorAll<HTMLElement>(":scope > .tab")[at];

      const measured = tab
        ? { l: tab.offsetLeft, r: el.clientWidth - tab.offsetLeft - tab.offsetWidth }
        : null;
      // Do not read box here: it is written by this effect, so tracking it creates a loop.
      box = measured;
      if (links && label && measured) last.set(label, measured);
    };
    const ro = new ResizeObserver(measure);
    const from = !ready && links && label ? last.get(label) : undefined;
    let frame: number;

    if (from) {
      // one frame at the old place, with the transition on, and only then the measured one
      box = from;
      frame = requestAnimationFrame(() => {
        ready = true;
        frame = requestAnimationFrame(() => ro.observe(el));
      });
    } else {
      measure();
      ro.observe(el);
      frame = requestAnimationFrame(() => (ready = true));
    }
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  });

  // Roving focus, as UI SDK's Tabs (and the WAI-ARIA tabs pattern): the row is one Tab stop, on
  // the chosen tab; the arrows, Home and End move along it and choose as they go
  const stop = $derived(
    items.find((i) => i.value === value && !i.disabled)?.value ??
      items.find((i) => !i.disabled)?.value,
  );

  function onKey(e: KeyboardEvent) {
    const list = e.currentTarget as HTMLElement;
    const tabs = [...list.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)')];
    const at = tabs.indexOf(e.target as HTMLButtonElement);
    const n = tabs.length;
    const back = list.matches(":dir(rtl)") ? "ArrowRight" : "ArrowLeft";
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? n - 1
          : e.key === back
            ? (at - 1 + n) % n
            : e.key === "ArrowRight" || e.key === "ArrowLeft"
              ? (at + 1) % n
              : -1;

    if (at < 0 || next < 0) return;
    e.preventDefault();
    tabs[next].focus();
    onChange?.(tabs[next].dataset.value!);
  }

  // The thumb can be dragged, not only clicked: press the chosen tab and slide along the row, and
  // whichever tab the pointer is over becomes the choice as it passes. The pointer is captured,
  // so the release lands back on the tab it started on — `slid` stops that click undoing the drag.
  let held: number | null = null;
  let slid = false;

  function grab(e: PointerEvent, item: Props["items"][number]) {
    if (item.value !== value || held !== null || e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    held = e.pointerId;
    slid = false;
    holdCursor("grabbing");
  }

  function slide(e: PointerEvent) {
    if (e.pointerId !== held || !row) return;
    const over = [...row.querySelectorAll<HTMLButtonElement>(':scope > [role="tab"]')].find((t) => {
      const r = t.getBoundingClientRect();

      return !t.disabled && e.clientX >= r.left && e.clientX <= r.right;
    });

    if (over && over.dataset.value !== value) {
      slid = true;
      onChange?.(over.dataset.value!);
    }
  }

  function release(e: PointerEvent) {
    if (e.pointerId === held) held = null;
  }
</script>

<!-- the tabs are the Tab stops; the list only hears their arrow keys -->
<!-- svelte-ignore a11y_interactive_supports_focus -->
{#snippet content(item: Props["items"][number])}
  {#if item.icon}
    <Icon name={item.icon} size={20} fill={item.value === value} />
  {:else}
    {item.label}
  {/if}
{/snippet}

{#if links}
  <nav
    class="tabs"
    class:full
    aria-label={label}
    style:view-transition-name={transition}
    bind:this={row}
  >
    {#each items as item (item.value)}
      <a
        class="tab type-label"
        class:active={item.value === value}
        class:icon-only={Boolean(item.icon)}
        href={item.href}
        aria-current={item.value === value ? "page" : undefined}
        aria-label={item.icon ? item.label : undefined}
        title={item.icon ? item.label : undefined}>{@render content(item)}</a
      >
    {/each}
    <div
      class="lit"
      class:ready
      class:off={!box}
      style:--l="{box?.l ?? 0}px"
      style:--r="{box?.r ?? 0}px"
      aria-hidden="true"
    >
      {#each items as item (item.value)}
        <span class="tab type-label" class:icon-only={Boolean(item.icon)}
          >{#if item.icon}<Icon name={item.icon} size={20} fill />{:else}{item.label}{/if}</span
        >
      {/each}
    </div>
  </nav>
{:else}
  <!-- focus lives on the tabs (roving tabindex), not on the list that handles their keys -->
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div class="tabs" class:full role="tablist" aria-label={label} onkeydown={onKey} bind:this={row}>
    {#each items as item (item.value)}
      <button
        type="button"
        role="tab"
        class="tab type-label"
        aria-selected={item.value === value}
        tabindex={item.value === stop ? 0 : -1}
        data-value={item.value}
        class:active={item.value === value}
        disabled={item.disabled}
        class:icon-only={Boolean(item.icon)}
        aria-label={item.icon ? item.label : undefined}
        title={item.icon ? item.label : undefined}
        onpointerdown={(e) => grab(e, item)}
        onpointermove={slide}
        onpointerup={release}
        onpointercancel={release}
        onclick={() => (slid ? (slid = false) : onChange?.(item.value))}
        >{@render content(item)}</button
      >
    {/each}
    <div
      class="lit"
      class:ready
      class:off={!box}
      style:--l="{box?.l ?? 0}px"
      style:--r="{box?.r ?? 0}px"
      aria-hidden="true"
    >
      {#each items as item (item.value)}
        <span class="tab type-label" class:icon-only={Boolean(item.icon)}
          >{#if item.icon}<Icon name={item.icon} size={20} fill />{:else}{item.label}{/if}</span
        >
      {/each}
    </div>
  </div>
{/if}

<style>
  .tabs {
    position: relative;
    display: flex;
    gap: 0.125rem;
    width: fit-content;
    min-width: 0;
    padding: 0.1875rem;
    border-radius: 625rem;
    background: oklch(from var(--color-text) l c h / 7%);

    &.full {
      width: 100%;

      .tab {
        flex: 1;
        min-width: 0;
      }
    }
  }
  .tab {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    height: calc(var(--control-height) - 0.375rem);
    padding: 0 0.875rem;
    border: none;
    border-radius: 625rem;
    background: transparent;
    color: oklch(from var(--color-text) l c h / 55%);
    text-decoration: none;
    cursor: pointer;
    transition:
      color 0.15s ease,
      background-color 0.15s ease,
      border-radius var(--spring-transition);
    /* a `full` row splits the width evenly, so a long label has to cut rather than push its
       neighbour out — the padding stays, only the text clips */
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;

    &.icon-only {
      padding: 0 0.625rem;
    }
    @media (hover: hover) {
      &:hover:not(.active, :disabled) {
        color: var(--color-text);
      }
    }
    &:active:not(:disabled) {
      border-radius: 0.5rem;
      transition-duration: 0.12s;
    }
    &:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }
    &:disabled {
      opacity: 0.4;
      cursor: default;
    }
  }
  /* the chosen tab of a tablist is the thumb, and the thumb can be dragged (see grab) — the hand
     shows only while it is held (holdCursor); a link row isn't draggable, its tabs are routes */
  [role="tab"].active {
    touch-action: none;
  }
  /* the chosen tab, drawn by the mask: the whole row again in the chosen colours, clipped to
     that tab's box (--l / --r: its distance from the row's left and right edges) */
  .lit {
    position: absolute;
    inset: 0;
    display: flex;
    gap: inherit;
    padding: inherit;
    border-radius: inherit;
    pointer-events: none;
    color: var(--color-background);
    background: var(--color-text);
    clip-path: inset(0.1875rem var(--r) 0.1875rem var(--l) round 625rem);

    &.ready {
      transition: clip-path var(--spring-transition);
    }
    &.off {
      visibility: hidden;
    }
    .tab {
      color: inherit;
      cursor: default;
    }
  }
  .full .lit .tab {
    flex: 1;
    min-width: 0;
  }
</style>
