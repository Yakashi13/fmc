<script lang="ts">
  import { Dialog } from "$lib/shared/components/dialog";
  import { Switch } from "$lib/shared/components/switch";
  import { watchAppearanceModel } from "../model";
  import { t } from "../i18n";
  const {
    $watchAppearance: appearance,
    $previewModel: model,
    $previewColor: color,
    $framePanelOpen: open,
    framePanelClosed,
    automaticChanged,
    previewModelPicked,
    previewColorPicked,
  } = watchAppearanceModel;
  const modelName = (v: string) => (v === "watch_3_pro" ? "Watch 3 Pro" : "Watch Pro 2");
  const colorName = (v: string) => $t.appearanceColors[v as keyof typeof $t.appearanceColors] ?? v;
</script>

<Dialog open={$open} title={$t.watchAppearance} onClose={() => framePanelClosed()}>
  <div class="automatic type-body">
    <span>{$t.appearanceAuto}</span>
    <Switch
      label={$t.appearanceAuto}
      checked={$model === "auto" && $color === "auto"}
      onChange={automaticChanged}
    />
  </div>
  <div class="models" role="group" aria-label={$t.appearanceModel}>
    {#each ["watch_pro_2", "watch_3_pro"] as v}
      <button
        type="button"
        class="option type-body"
        class:on={$appearance.model === v}
        aria-pressed={$appearance.model === v}
        onclick={() => previewModelPicked(v)}
      >
        <img src={`/frames/${v.replaceAll("_", "-")}-dark-grey.webp`} alt="" />
        <span>{modelName(v)}</span>
      </button>
    {/each}
  </div>
  <div class="colors" role="group" aria-label={$t.appearanceColor}>
    {#each $appearance.colors as v}
      <button
        type="button"
        class="option type-small"
        class:on={$appearance.color === v}
        aria-pressed={$appearance.color === v}
        onclick={() => previewColorPicked(v)}
      >
        <img src={`/frames/${$appearance.model.replaceAll("_", "-")}-${v}.webp`} alt="" />
        <span>{colorName(v)}</span>
      </button>
    {/each}
  </div>
</Dialog>

<style>
  .automatic {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    min-height: var(--control-height);
    padding: 0 0.75rem;
    margin-bottom: 0.75rem;
    border: none;
    border-radius: var(--border-radius);
    color: var(--color-text);
    background: oklch(from var(--color-text) l c h / 5%);
  }
  .models,
  .colors {
    display: grid;
    gap: 0.5rem;
  }
  .models {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    margin-bottom: 0.75rem;
  }
  .colors {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    padding: 0.75rem 0.25rem;
    border: none;
    border-radius: var(--border-radius);
    color: oklch(from var(--color-text) l c h / 65%);
    background: transparent;
    cursor: pointer;
  }
  .option img {
    display: block;
    width: 100%;
    height: 8rem;
    object-fit: contain;
  }
  .colors .option img {
    height: 5rem;
  }
  .option.on {
    background: oklch(from var(--color-text) l c h / 8%);
    color: var(--color-text);
    box-shadow: inset 0 0 0 1px oklch(from var(--color-text) l c h / 25%);
  }
  .option:focus-visible,
  .automatic:focus-visible {
    outline: 2px solid var(--color-text);
    outline-offset: 2px;
  }
  @media (hover: hover) {
    .option:hover,
    .automatic:hover {
      background: oklch(from var(--color-text) l c h / 6%);
    }
  }
</style>
