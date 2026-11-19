<script lang="ts">
  import { Icon } from "../icon";

  type Props = {
    href: string;
  };
  const { href }: Props = $props();
</script>

<a {href}>
  <Icon name="arrow_back" size={22} />
</a>

<style>
  a {
    height: var(--control-height);
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: oklch(from var(--color-text) l c h / 8%);
    width: var(--control-height);
    text-decoration: none;
    color: var(--color-text);
    transition: transform var(--spring-transition);

    &:hover {
      background-color: oklch(from var(--color-text) l c h / 14%);
    }

    &:active {
      transform: scale(0.95);
    }
  }
</style>
