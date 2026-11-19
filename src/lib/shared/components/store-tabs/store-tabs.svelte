<script lang="ts">
  // The store's sections, as the page's own title: every shelf page opens with this row. It is
  // the app's segmented control (tabs/) with a link per section — each section is a route. On a
  // phone the four split the full width, so nothing is cut off and nothing scrolls.
  import { page } from "$app/state";
  import { MediaQuery } from "svelte/reactivity";
  import { Tabs } from "../tabs";

  const path = $derived(page.url.pathname);
  const phone = new MediaQuery("(max-width: 767px)");
  const sections = [
    // "Faces", not "Watchfaces": four titles have to fit one row on a phone
    { value: "faces", label: "Faces", href: "/" },
    { value: "apps", label: "Apps", href: "/apps" },
    { value: "firmware", label: "Firmware", href: "/firmware" },
    { value: "community", label: "Community", href: "/community" },
  ];
  const current = $derived(
    path.startsWith("/apps")
      ? "apps"
      : path.startsWith("/firmware")
        ? "firmware"
        : path.startsWith("/community")
          ? "community"
          : "faces",
  );
</script>

<Tabs items={sections} value={current} full={phone.current} label="Store sections" />
