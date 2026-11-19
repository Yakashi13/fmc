<script lang="ts">
  import { Dialog } from "$lib/shared/components/dialog";

  let { open = false, onClose }: { open?: boolean; onClose?: () => void } = $props();
</script>

<Dialog {open} title="Test dialog" {onClose}>
  <p>content</p>
</Dialog>
