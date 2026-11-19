<script lang="ts">
  import { holdCursor } from "$lib/shared/lib/hold-cursor";
  interface Props {
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    // suffix shown next to the value ("%", "px", …); omit to hide the readout
    unit?: string;
    // custom rail background (e.g. a hue gradient) — replaces the accent fill
    track?: string;
    onInput?: (value: number) => void;
    onChange?: (value: number) => void;
  }
  let {
    value = $bindable(0),
    min = 0,
    max = 100,
    step = 1,
    disabled,
    unit,
    track,
    onInput,
    onChange,
  }: Props = $props();
  // the filled part of the track — the native range gives no hook for it
  const pct = $derived(((value - min) / (max - min || 1)) * 100);
  const rail = $derived(
    track ??
      `linear-gradient(var(--color-text), var(--color-text)) 0 / ${pct}% 100% no-repeat,
       oklch(from var(--color-text) l c h / 14%)`,
  );
</script>

<span class="root" style="--rail: {rail}">
  <input
    type="range"
    bind:value
    {min}
    {max}
    {step}
    {disabled}
    aria-valuetext={unit != null ? `${value}${unit}` : undefined}
    oninput={() => onInput?.(value)}
    onchange={() => onChange?.(value)}
    onpointerdown={() => !disabled && holdCursor("grabbing")}
  />
  {#if unit != null}<span class="readout type-caption type-mono">{value}{unit}</span>{/if}
</span>

<style>
  .root {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 0.625rem;
    min-width: 0;
  }
  input {
    flex: 1;
    min-width: 0;
    height: 1.5rem;
    margin: 0;
    background: transparent;
    appearance: none;
    /* the hand only while the knob is held (holdCursor), not on hover */
    cursor: pointer;

    &:disabled {
      opacity: 0.45;
      cursor: default;
    }
  }
  input::-webkit-slider-runnable-track,
  input::-moz-range-track {
    height: 0.25rem;
    border-radius: 999px;
    background: var(--rail);
  }
  /* a thin rail filled in ink, and a plain disc for the knob: one shape, no ring — a soft
     shadow is what lifts it off the filled part of the rail */
  input::-webkit-slider-thumb {
    appearance: none;
    width: 1.125rem;
    height: 1.125rem;
    margin-top: calc((0.25rem - 1.125rem) / 2); /* centres the thumb on the track */
    border: none;
    border-radius: 50%;
    background: var(--color-text);
    box-shadow: 0 1px 4px oklch(0 0 0 / 35%);
    transition: transform var(--spring-transition, 0.15s ease);
  }
  input::-moz-range-thumb {
    width: 1.125rem;
    height: 1.125rem;
    border: none;
    border-radius: 50%;
    background: var(--color-text);
    box-shadow: 0 1px 4px oklch(0 0 0 / 35%);
    transition: transform var(--spring-transition, 0.15s ease);
  }
  input:active::-webkit-slider-thumb {
    transform: scale(1.15);
  }
  input:active::-moz-range-thumb {
    transform: scale(1.15);
  }
  @media (hover: hover) {
    input:hover::-webkit-slider-thumb {
      transform: scale(1.15);
    }
    input:hover::-moz-range-thumb {
      transform: scale(1.15);
    }
  }
  input:focus-visible {
    outline: none;
  }
  input:focus-visible::-webkit-slider-thumb {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  input:focus-visible::-moz-range-thumb {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  .readout {
    flex-shrink: 0;
    width: 4.5ch;
    text-align: end;
    color: oklch(from var(--color-text) l c h / 55%);
    font-variant-numeric: tabular-nums;
  }
</style>
