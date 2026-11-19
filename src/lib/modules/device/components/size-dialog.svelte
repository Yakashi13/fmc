<script lang="ts">
  // Shown when a face has an image bigger than any factory face uses — the upload waits in the
  // model until the user accepts the risk or backs out.
  import { Button } from "$lib/shared/components/button";
  import { Dialog } from "$lib/shared/components/dialog";
  import { bleModel } from "../model";

  const { $sizeWarning: warning, sizeConfirmed, sizeWarningClosed } = bleModel;
</script>

<Dialog
  open={$warning !== null}
  title="This face may be too big for the watch"
  onClose={() => sizeWarningClosed()}
>
  <p class="desc">{$warning}</p>
  {#snippet actions()}
    <Button kind="secondary" onClick={() => sizeWarningClosed()}>Cancel</Button>
    <Button kind="danger" onClick={() => sizeConfirmed()}>Install anyway</Button>
  {/snippet}
</Dialog>

<style>
  .desc {
    margin: 0;
  }
</style>
