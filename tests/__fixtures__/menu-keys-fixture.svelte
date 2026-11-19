<script lang="ts">
  import { Menu, MenuItem } from "$lib/shared/components/menu";
  import { Icon } from "$lib/shared/components/icon";

  let { onPick }: { onPick?: (v: string) => void } = $props();
</script>

<Menu>
  {#snippet trigger({ toggle })}
    <button data-testid="trigger" onclick={toggle}>open</button>
  {/snippet}
  <MenuItem onClick={() => onPick?.("apple")}><Icon name="download" />Apple</MenuItem>
  <MenuItem disabled onClick={() => onPick?.("banana")}>Banana</MenuItem>
  <MenuItem onClick={() => onPick?.("cherry")}>Cherry</MenuItem>
  <MenuItem onClick={() => onPick?.("cranberry")}>Cranberry</MenuItem>
</Menu>
