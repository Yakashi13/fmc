<script lang="ts">
  interface Props {
    value?: string;
    placeholder?: string;
    rows?: number;
    disabled?: boolean;
    maxlength?: number;
    onInput?: (value: string) => void;
  }
  let {
    value = $bindable(""),
    placeholder,
    rows = 3,
    disabled,
    maxlength,
    onInput,
  }: Props = $props();
</script>

<textarea
  class="type-body"
  {placeholder}
  {rows}
  {disabled}
  {maxlength}
  bind:value
  oninput={() => onInput?.(value)}></textarea>

<style>
  textarea {
    width: 100%;
    padding: 0.5rem 0.75rem;
    color: var(--color-text);
    background: oklch(from var(--color-text) l c h / 7%);
    border: none;
    border-radius: var(--border-radius);
    resize: vertical;

    &::placeholder {
      color: oklch(from var(--color-text) l c h / 40%);
    }
    &:focus {
      outline: none;
      /* one quiet line on the box's own edge and a step lighter fill — no halo around it */
      background: oklch(from var(--color-text) l c h / 12%);
      box-shadow: inset 0 0 0 1px oklch(from var(--color-text) l c h / 35%);
    }
  }
</style>
