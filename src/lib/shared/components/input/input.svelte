<script lang="ts">
  interface Props {
    value?: string;
    type?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    name?: string;
    autocomplete?: string;
    minlength?: number;
    maxlength?: number;
    min?: number | string;
    max?: number | string;
    step?: number | string;
    label?: string;
    unit?: string;
    onInput?: (value: string) => void;
    onChange?: (value: string) => void;
  }
  let {
    value = $bindable(""),
    type,
    placeholder,
    disabled,
    required,
    name,
    autocomplete,
    minlength,
    maxlength,
    min,
    max,
    step,
    label,
    unit,
    onInput,
    onChange,
  }: Props = $props();
</script>

<!-- the box carries the field chrome; label/unit live inside it, Figma-inspector style -->
<label class="box">
  {#if label}<span class="tag">{label}</span>{/if}
  <input
    type={type ?? "text"}
    {placeholder}
    {disabled}
    {required}
    {name}
    {minlength}
    {maxlength}
    {min}
    {max}
    {step}
    autocomplete={autocomplete as any}
    bind:value
    oninput={() => onInput?.(value)}
    onchange={() => onChange?.(value)}
  />
  {#if unit}<span class="tag">{unit}</span>{/if}
</label>

<style>
  .box {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    width: 100%;
    height: var(--control-height);
    padding: 0 0.625rem;
    background: oklch(from var(--color-text) l c h / 4%);
    /* an instrument's field, not a pill: a hairline box that lights up when it has the caret */
    border: 1px solid oklch(from var(--color-text) l c h / 10%);
    border-radius: var(--border-radius);
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease;
    cursor: text;

    @media (hover: hover) {
      &:hover {
        border-color: oklch(from var(--color-text) l c h / 22%);
      }
    }
    &:focus-within {
      border-color: var(--color-accent);
      background: oklch(from var(--color-text) l c h / 2%);
    }

    &:has(input:disabled) {
      opacity: 0.5;
    }
  }
  .tag {
    flex-shrink: 0;
    font-family: var(--font-mono);
    font-size: 0.75rem;
    text-transform: uppercase;
    color: oklch(from var(--color-text) l c h / 45%);
    user-select: none;
  }
  input {
    flex: 1;
    width: 100%;
    min-width: 0;
    padding: 0;
    border: none;
    background: transparent;
    font: inherit;
    font-size: 1rem;
    color: var(--color-text);
    outline: none;

    &::placeholder {
      color: oklch(from var(--color-text) l c h / 40%);
    }

    caret-color: var(--color-accent);
    &::selection {
      background-color: oklch(from var(--color-accent) l c h / 20%);
    }

    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      appearance: none;
    }
  }
</style>
