<script lang="ts">
  import "$lib/styles/tokens.css";
  import "$lib/styles/global.css";
  import { afterNavigate, onNavigate } from "$app/navigation";
  import { sendEvent } from "$lib/modules/analytics/lib/aptabase";
  // one global mount: flashing is triggered from the editor, the popover lives in the app chrome
  import SlotDialog from "$lib/modules/device/components/slot-dialog.svelte";
  import SizeDialog from "$lib/modules/device/components/size-dialog.svelte";

  let { children } = $props();

  // Aptabase has no pageviews of its own. The route id, not the url: "/market/[id]" is one page
  // in the dashboard, and face_view already says which face
  // a page change is a view transition where the browser has them (the animation itself is
  // CSS, in global.css); everywhere else the page just swaps
  onNavigate((navigation) => {
    if (!document.startViewTransition) return;
    // the same page with another query (?mine, ?liked) is not a page change
    if (navigation.from?.url.pathname === navigation.to?.url.pathname) return;
    return new Promise((resolve) => {
      document.startViewTransition(async () => {
        resolve();
        await navigation.complete;
      });
    });
  });

  afterNavigate(({ to }) => sendEvent("page_view", { page: to?.route.id ?? "unknown" }));
</script>

{@render children()}
<SlotDialog />
<SizeDialog />
