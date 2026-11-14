<script lang="ts">
  import { page } from "$app/state";
  import { FirmwarePage } from "$lib/modules/store/pages";
</script>

<FirmwarePage id={page.params.id ?? ""} />
