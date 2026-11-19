<script lang="ts">
  import { Tabs } from "$lib/shared/components/tabs";

  let value = $state("a");
</script>

<p data-testid="value">{value}</p>
<Tabs
  {value}
  items={[
    { value: "a", label: "A" },
    { value: "b", label: "B", disabled: true },
    { value: "c", label: "C" },
  ]}
  onChange={(v) => (value = v)}
/>
