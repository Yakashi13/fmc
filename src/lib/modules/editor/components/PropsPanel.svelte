<script lang="ts">
  // Inspector for the selected node, in three sections: where it sits, what data it shows,
  // and the bitmaps it draws. The shared field chrome lives here so the sections carry only
  // what is theirs.
  import { Button } from "$lib/shared/components/button";
  import { Icon } from "$lib/shared/components/icon";
  import { PanelSection } from "$lib/shared/components/panel-section";
  import Geometry from "./props/geometry.svelte";
  import Source from "./props/source.svelte";
  import Frames from "./props/frames.svelte";
  import { editorModel } from "../model";
  const { $doc: doc, $selected: selected, invertColorsRequested } = editorModel;

  // the primary selection — the sections are all single-layer
  const layer = $derived($selected[0] ?? null);
</script>

<div class="panel">
  {#if layer}
    <fieldset class="fields" disabled={Boolean(layer.locked)}>
      {#if layer.locked}
        <p class="hint-xs">locked — unlock it in the layer tree to edit</p>
      {/if}
      <!-- a section with nothing to show for this kind of layer hides itself, title and all -->
      <PanelSection title="Layout"><Geometry {layer} /></PanelSection>
      <PanelSection title="Data"><Source {layer} /></PanelSection>
      <PanelSection title="Art"><Frames {layer} /></PanelSection>
    </fieldset>
  {:else}
    <p class="hint">Nothing selected.</p>
  {/if}
  {#if $doc}
    <div class="row">
      <Button kind="secondary" onClick={() => invertColorsRequested()}>
        <Icon name="contrast" size={22} />
        invert {layer ? "layer" : "screen"}
      </Button>
    </div>
  {/if}
</div>

<style>
  .fields {
    display: contents;
    border: none;
    margin: 0;
    padding: 0;
  }
  .panel {
    /* a dense surface: every field in here is shorter than the app's default */
    --control-height: 1.875rem;

    display: flex;
    flex-direction: column;
    font-size: 0.85rem;
  }
  .panel > .row {
    padding-top: 0.875rem;
    border-top: 1px solid oklch(from var(--color-text) l c h / 10%);
  }
  .hint {
    margin: 0;
    font-size: 0.9rem;
    color: oklch(from var(--color-text) l c h / 55%);
  }
  .panel :global {
    /* actions inside a dense panel are the size of its fields, not of a page's buttons */
    .btn {
      height: var(--control-height);
      padding-inline: 0.625rem;
      border-radius: var(--border-radius);
      font-size: 0.85rem;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .field-label {
      flex-shrink: 0;
      font-weight: 500;

      &.w-sm {
        width: 2rem;
      }
      &.w-md {
        width: 3.5rem;
      }
    }
    .muted-label {
      display: block;
      margin-bottom: 0.375rem;
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: oklch(from var(--color-text) l c h / 55%);
    }
    .hint-xs {
      margin: 0;
      font-size: 0.75rem;
      line-height: 1.4;
      color: oklch(from var(--color-text) l c h / 55%);
    }
    .w-num {
      display: inline-block;
      width: 4rem;
      flex-shrink: 0;
    }
    /* a segmented pill: one recessed track, equal segments, the active one raised */
    .btn-group {
      display: flex;
      flex: 1;
      gap: 0.125rem;
      padding: 0.125rem;
      background: oklch(from var(--color-text) l c h / 5%);
      border-radius: var(--border-radius);

      .icon-btn {
        flex: 1;
        width: auto;
        height: 1.625rem;
        border: none;
        border-radius: calc(var(--border-radius) - 0.125rem);

        &.on {
          background: oklch(from var(--color-text) l c h / 10%);
          color: var(--color-accent);
        }
      }
    }
    .grow {
      flex: 1;
    }
    .icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      min-width: 2rem;
      height: 2rem;
      border: none;
      border-radius: var(--border-radius);
      background: oklch(from var(--color-text) l c h / 10%);
      color: var(--color-text);
      cursor: pointer;
      transition: var(--spring-transition);

      @media (hover: hover) {
        &:hover {
          background: oklch(from var(--color-text) l c h / 6%);
          color: var(--color-text);
        }
      }
      &.on {
        color: var(--color-text);
        background-color: var(--color-accent);
      }
    }
    .check-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .check-label {
      border: none;
      background: transparent;
      padding: 0;
      margin: 0;
      font: inherit;
      color: inherit;
      text-align: start;
      cursor: pointer;
    }
  }
</style>
