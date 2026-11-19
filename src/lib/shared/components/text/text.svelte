<script lang="ts" module>
  // The app's whole type scale. The styles live in global.css (`.type-*`) so a control that
  // renders its own text can wear one without nesting a component.
  export type TextVariant =
    | "display" // a detail page's name
    | "title" // a page or dialog title
    | "heading" // a section or sheet heading
    | "subtitle" // a name in a row or card, emphasis at body size
    | "body"
    | "small" // a description under a name
    | "caption" // meta: dates, counts, hints
    | "label"; // mono small caps over a field or under a number
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<HTMLElement> {
    variant?: TextVariant;
    // the element; defaults to a heading for the serif steps, a span otherwise
    as?: string;
    tone?: "default" | "muted" | "accent" | "error";
    // one line, cut with an ellipsis
    truncate?: boolean;
    children?: Snippet;
  }
  const {
    variant = "body",
    as,
    tone = "default",
    truncate = false,
    class: cls = "",
    children,
    ...rest
  }: Props = $props();

  const TAG: Partial<Record<TextVariant, string>> = { display: "h1", title: "h1", heading: "h2" };
</script>

<svelte:element
  this={as ?? TAG[variant] ?? "span"}
  class="text type-{variant} tone-{tone} {cls}"
  class:truncate
  {...rest}>{@render children?.()}</svelte:element
>

<style>
  /* spacing belongs to the layout around the text, not to the element it happens to be */
  .text {
    margin: 0;
  }
  .tone-muted {
    color: oklch(from var(--color-text) l c h / 55%);
  }
  .tone-accent {
    color: var(--color-accent);
  }
  .tone-error {
    color: var(--color-error);
  }
  .truncate {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
</style>
