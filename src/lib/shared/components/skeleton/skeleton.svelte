<script lang="ts">
  interface Props {
    width?: string;
    height?: string;
    /** a disc (an avatar, an app icon) instead of a line */
    round?: boolean;
  }
  const { width = "100%", height = "1rem", round = false }: Props = $props();
</script>

<div class="skeleton" class:round style:width style:height></div>

<style>
  .skeleton {
    border-radius: calc(var(--border-radius) / 2);
    background: oklch(from var(--color-text) l c h / 8%);
    animation: pulse 1.4s ease-in-out infinite;

    &.round {
      flex: none;
      border-radius: 50%;
    }
  }
  @keyframes pulse {
    50% {
      opacity: 0.5;
    }
  }
</style>
