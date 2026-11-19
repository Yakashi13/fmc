<script lang="ts">
  import { tick, type Snippet } from "svelte";
  import { quintOut } from "svelte/easing";

  interface Props {
    trigger: Snippet<[{ open: boolean; toggle: () => void }]>;
    align?: "start" | "end";
    children?: Snippet;
  }
  const { trigger, align = "end", children }: Props = $props();

  // the menu drops out of its trigger: it fades in while sliding down and growing to size
  // ponytail: always from above — a menu that position-try flipped upward still slides down;
  // read the resolved side and flip the sign if that ever reads wrong
  const pop = (_: Element, { duration = 280 }: { duration?: number } = {}) => ({
    duration,
    easing: quintOut,
    css: (t: number) =>
      `opacity: ${t}; transform: translateY(${(t - 1) * 0.75}rem) scale(${0.96 + 0.04 * t})`,
  });

  // where anchor positioning is available the menu goes into the top layer, so a card's scroll
  // container can't clip it and position-try flips it back on screen near an edge. Older
  // browsers keep the absolutely-positioned menu inside .root.
  const anchored = typeof CSS !== "undefined" && CSS.supports("anchor-name: --a");
  const uid = $props.id();
  const anchor = `--menu-${uid}`;

  let open = $state(false);
  let root = $state<HTMLDivElement>();
  let menu = $state<HTMLDivElement>();

  // the popover API is imperative; mirror `open` into it and let CSS animate both ways
  $effect(() => {
    if (!anchored || !menu) return;
    if (open) menu.showPopover();
    else if (menu.matches(":popover-open")) menu.hidePopover();
  });

  const inside = (target: Node) => Boolean(root?.contains(target) || menu?.contains(target));

  // The keyboard model is the WAI-ARIA menu button (the behaviours UI SDK's Menu is built from:
  // popup, roving focus, typeahead). The trigger is the caller's snippet, so its ARIA is set here
  // rather than asking every caller to spell it.
  const ITEM = '[role^="menuitem"]';
  const items = () => [...(menu?.querySelectorAll<HTMLElement>(`${ITEM}:not(:disabled)`) ?? [])];
  const triggerEl = () =>
    [
      ...(root?.querySelectorAll<HTMLElement>('button, a[href], [tabindex]:not([tabindex="-1"])') ??
        []),
    ].find((el) => !menu?.contains(el));

  $effect(() => {
    const t = triggerEl();

    if (!t) return;
    t.setAttribute("aria-haspopup", "menu");
    t.setAttribute("aria-expanded", String(open));
    if (open) t.setAttribute("aria-controls", `menu-${uid}`);
    else t.removeAttribute("aria-controls");
  });

  // which item takes focus once the menu is up: a keyboard open lands on the first (or, for a
  // select, the chosen) item, ArrowUp on the last; a pointer open focuses the menu itself, so no
  // row lights up until the pointer or an arrow picks one
  let land: "first" | "last" | "none" = "none";

  function show(at: typeof land) {
    land = at;
    open = true;
  }

  function close(refocus: boolean) {
    open = false;
    if (refocus) triggerEl()?.focus({ preventScroll: true });
  }

  function toggle() {
    if (open) return close(false);
    show(triggerEl()?.matches(":focus-visible") ? "first" : "none");
  }

  $effect(() => {
    if (!open || !menu) return;
    const list = items();
    const chosen = list.find((i) => i.getAttribute("aria-checked") === "true");
    const target = land === "last" ? list.at(-1) : land === "first" ? list[0] : undefined;

    (chosen ?? target ?? menu).focus({ preventScroll: true });
  });

  function move(to: (at: number, n: number) => number) {
    const list = items();

    if (!list.length) return;
    const at = list.indexOf(document.activeElement as HTMLElement);

    list[to(at, list.length)]?.focus({ preventScroll: true });
  }

  // a row's visible label: icons are ligature text, keycaps are a shortcut — neither is the name
  function label(el: HTMLElement) {
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let s = "";

    while (walk.nextNode())
      if (!walk.currentNode.parentElement?.closest('[aria-hidden="true"], kbd'))
        s += walk.currentNode.textContent;
    return s.trim().toLowerCase();
  }

  // typeahead: letters typed within half a second build one query; the same letter repeated
  // cycles through the rows that start with it
  let typed = "";
  let typedAt = 0;

  function typeahead(key: string) {
    const now = performance.now();

    typed = now - typedAt > 500 ? key.toLowerCase() : typed + key.toLowerCase();
    typedAt = now;
    const list = items();
    const at = list.indexOf(document.activeElement as HTMLElement);
    const q = [...typed].every((c) => c === typed[0]) ? typed[0] : typed;
    const from = q.length === 1 ? at + 1 : Math.max(at, 0);

    [...list.slice(from), ...list.slice(0, from)]
      .find((i) => label(i).startsWith(q))
      ?.focus({ preventScroll: true });
  }

  function onKey(e: KeyboardEvent) {
    const inMenu = Boolean(menu?.contains(e.target as Node));

    if (!inMenu) {
      // on the trigger: the arrows open the menu, straight onto its first or last row
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (open) move((_, n) => (e.key === "ArrowDown" ? 0 : n - 1));
        else show(e.key === "ArrowDown" ? "first" : "last");
      } else if (open && e.key === "Escape") {
        e.preventDefault(); // a menu inside a dialog closes alone, the dialog stays
        close(true);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        return (e.preventDefault(), move((at, n) => (at + 1) % n));
      case "ArrowUp":
        return (e.preventDefault(), move((at, n) => (at < 0 ? n - 1 : (at - 1 + n) % n)));
      case "Home":
        return (e.preventDefault(), move(() => 0));
      case "End":
        return (e.preventDefault(), move((_, n) => n - 1));
      case "Escape":
        e.preventDefault();
        return close(true);
      case "Tab":
        // back to the trigger, and the browser carries focus on from there (rows are tabindex -1)
        return close(true);
      case " ":
        // a link row: Space doesn't follow links natively
        if ((e.target as Element).matches("a")) {
          e.preventDefault();
          (e.target as HTMLElement).click();
        }
        return;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) typeahead(e.key);
    }
  }
</script>

<svelte:window
  onpointerdown={(e) => {
    if (open && !inside(e.target as Node)) open = false;
  }}
/>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="root"
  class:open
  bind:this={root}
  style={anchored ? `anchor-name: ${anchor}` : undefined}
  onkeydown={onKey}
>
  {@render trigger({ open, toggle })}
  {#if open}
    <!-- the keys are handled on .root, which holds both the trigger and the menu -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      id="menu-{uid}"
      class="menu align__{align}"
      class:anchored
      role="menu"
      tabindex="-1"
      bind:this={menu}
      popover={anchored ? "manual" : undefined}
      style={anchored ? `position-anchor: ${anchor}` : undefined}
      onclick={(e) => {
        const row = (e.target as Element).closest(ITEM);

        if (!row) return;
        // a `stay` row swapped the menu's content (a submenu, or back out of one) and is gone
        // with it: the menu takes the focus, so the arrows keep working
        if (row.hasAttribute("data-stay"))
          return void tick().then(() => menu?.focus({ preventScroll: true }));
        // a row was picked: focus goes back where it came from, if the menu had it
        close(Boolean(menu?.contains(document.activeElement)));
      }}
      onpointermove={(e) => {
        // the highlight follows the pointer, so pointer and arrows share one current row
        if (e.pointerType !== "mouse") return;
        const row = (e.target as Element).closest<HTMLElement>(ITEM);

        if (row && row !== document.activeElement && !row.matches(":disabled"))
          row.focus({ preventScroll: true });
      }}
      onpointerleave={(e) => {
        if (e.pointerType === "mouse" && menu?.contains(document.activeElement))
          menu.focus({ preventScroll: true });
      }}
      in:pop
      out:pop={{ duration: 160 }}
    >
      {@render children?.()}
    </div>
  {/if}
</div>

<style>
  .root {
    position: relative;
    display: inline-flex;
    min-width: 0;
  }

  .root > :global(:first-child) {
    flex: 1;
    min-width: 0;
  }

  .menu {
    position: absolute;
    top: calc(100% + 0.625rem);
    z-index: 50;
    min-width: 13rem;
    max-height: min(20rem, calc(100vh - 2rem));
    overflow-y: auto;
    padding: 0.375rem;
    flex-direction: column;
    gap: 0.125rem;
    border-radius: 1.25rem;
    background: var(--color-surface);
    border: 1px solid oklch(from var(--color-text) l c h / 14%);
    box-shadow: 0 16px 48px oklch(0 0 0 / 45%);

    /* frosted glass over whatever it opens on; opaque where blur isn't available */
    @supports (backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)) {
      /* dense enough that a busy dial under it never muddies the rows */
      background: oklch(from var(--color-surface) l c h / 86%);
      -webkit-backdrop-filter: blur(2rem);
      backdrop-filter: blur(2rem);
    }
    @media (prefers-reduced-transparency: reduce) {
      background: var(--color-surface);
      -webkit-backdrop-filter: none;
      backdrop-filter: none;
    }
    display: flex;
    outline: none; /* it holds focus after a pointer open; the rows show where focus is */
    /* it grows out of its trigger's edge, not out of its own middle */
    transform-origin: top;
  }

  .align__end {
    inset-inline-end: 0;
    transform-origin: top right;
  }
  .align__start {
    inset-inline-start: 0;
    transform-origin: top left;
  }

  .anchored {
    display: flex;
    position: fixed;
    margin: 0.625rem 0;
    min-width: min(max(13rem, anchor-size(width)), calc(100vw - 1.5rem));
    top: 100%;
    inset: 0;
    /* it opens to whichever side of the trigger has more room — above a trigger low on the
       screen (the dock's Account tab, a row near the bottom of a sheet), leftward at the
       screen's edge — and takes all the room that side has: a list scrolls only when it is
       taller than that. 100% here is the room on that side, not the page */
    position-try-order: most-block-size;
    position-try-fallbacks:
      flip-block,
      flip-inline,
      flip-block flip-inline;
    /* less the gap on both ends: at a full 100% a long list overflows its side by the margin,
       and the browser shifts it back up over its own trigger to fit */
    max-height: calc(100% - 1.25rem);
    /* nor wider than the room from its edge to the screen's, less a small gap: a select near
       the edge opens back across the screen (flip-inline) rather than past it */
    max-width: calc(100% - 0.5rem);
  }

  .anchored.align__end {
    position-area: block-end span-inline-start;
  }
  .anchored.align__start {
    position-area: block-end span-inline-end;
  }
</style>
