<script lang="ts">
  import { page } from "$app/state";
  import { AppPage } from "$lib/modules/store/pages";
</script>

<AppPage id={page.params.id ?? ""} />
