<script lang="ts">
  // One firmware image: what it changes, how far it has been proven, and the download —
  // which waits for the reader to say they know what flashing can do.
  import { BackBtn } from "$lib/shared/components/back-btn";
  import { Badge } from "$lib/shared/components/badge";
  import { Button } from "$lib/shared/components/button";
  import { Checkbox } from "$lib/shared/components/checkbox";
  import { Icon } from "$lib/shared/components/icon";
  import { Page } from "$lib/shared/components/page";
  import { Prose } from "$lib/shared/components/prose";
  import { Skeleton } from "$lib/shared/components/skeleton";
  import { StatStrip } from "$lib/shared/components/stat-strip";
  import { fileUrl } from "$lib/shared/api";
  import { compact, day } from "$lib/shared/lib/format";
  import { deviceLabel } from "$lib/modules/market/lib/devices";
  import { authModel } from "$lib/modules/auth/model";
  import { bleModel } from "$lib/modules/device/model";
  import { firmwareKind, testedLabel, testedOnHardware } from "../lib/firmware";
  import { FLASH_LIMITS, WATCH_UTILS_DOCS } from "../lib/links";
  import { storeModel } from "../model";

  interface Props {
    id: string;
  }
  const { id }: Props = $props();

  const {
    $firmware: firmware,
    $firmwareLoading: loading,
    $riskAccepted: riskAccepted,
    firmwareRequested,
    riskAcceptedSet,
    flashRequested,
    downloadRequested,
    $imageSaving: imageSaving,
    $imageFetching: imageFetching,
    $imageErr: imageErr,
    $firmwareOnWatch: onWatch,
  } = storeModel;
  const { $canFlash: canFlash } = authModel;
  const {
    $bleInfo: watch,
    $bleStatus: bleStatus,
    $connecting: connecting,
    $otaFlashing: flashing,
    $otaProgress: progress,
    $otaResult: result,
    $otaError: otaError,
    $wp2: wp2,
    $wp2Reading: wp2Reading,
    OTA_MIN_BATTERY,
    connectRequested,
  } = bleModel;
  const busy = $derived($imageFetching || $flashing);
  const error = $derived($imageErr || $otaError);

  $effect(() => {
    firmwareRequested(id);
  });

  const fw = $derived($firmware);
  const kind = $derived(firmwareKind(fw?.kind));
  const onHardware = $derived(testedOnHardware(fw?.tested));
  const stats = $derived(
    fw
      ? [
          ...(fw.version ? [{ label: "Version", value: fw.version }] : []),
          { label: "Downloads", value: compact(fw.downloads) },
        ]
      : [],
  );
</script>

<svelte:head><title>{fw?.name ?? "Firmware"} — firmware for the CMF Watch Pro 2</title></svelte:head
>

<Page>
  <div class="detail">
    <BackBtn href="/firmware" />

    {#if fw}
      <div class="cover" class:bare={!fw.cover}>
        {#if fw.cover}
          <img src={fileUrl(fw, "cover")} alt="" />
        {:else}
          <Icon name={kind.icon} size={48} />
        {/if}
      </div>

      <header class="identity">
        <h1>{fw.name}</h1>
        {#if fw.summary}<p class="summary">{fw.summary}</p>{/if}
        <div class="badges">
          <Badge quiet>{kind.label}</Badge>
          {#if testedLabel(fw.tested)}
            <Badge quiet={onHardware} warn={!onHardware}>
              <Icon name={onHardware ? "verified" : "warning"} size={14} />
              {testedLabel(fw.tested)}
            </Badge>
          {/if}
          {#if deviceLabel(fw.device)}<Badge quiet>{deviceLabel(fw.device)}</Badge>{/if}
        </div>
        <!-- the stock build it sits on is a long string ("JX402 1.0.0.73"): a sentence has
             room for it, a stat tile doesn't -->
        {#if kind.hint || fw.base}
          <p class="hint">
            {kind.hint}
            {#if fw.base}Built on {fw.base}.{/if}
          </p>
        {/if}
      </header>

      <StatStrip items={stats} />

      {#if fw.image && !$canFlash}
        <!-- the image is served to flashers only (fmc_pocketbase store.pb.js) — say so instead
             of a download that would answer 403 -->
        <section class="how">
          <h2>Not available yet</h2>
          <p>
            While flashing from FMC is new, this image is open to a few testers only. The source is
            linked below, and the guide further down covers flashing an image yourself.
          </p>
        </section>
      {:else if fw.image}
        <section class="risk">
          <h2><Icon name="warning" size={22} /> Before you download</h2>
          <p>
            {#if onHardware}
              This image has been flashed to a real watch. Yours can still behave differently.
            {:else}
              This image has only run in the emulator. Nobody has confirmed it on a real watch.
            {/if}
            A bad flash can leave the watch unusable, and recovery isn't guaranteed.
            <a href={FLASH_LIMITS} target="_blank" rel="noopener noreferrer">Read the limits</a>
          </p>
          <label class="accept">
            <Checkbox checked={$riskAccepted} onChange={(v) => riskAcceptedSet(v)} />
            <span>I understand this can brick my watch</span>
          </label>
          <Button
            size="large"
            kind="danger"
            onClick={() => downloadRequested()}
            disabled={!$riskAccepted || $imageSaving}
          >
            <Icon name="download" size={22} />
            {$imageSaving ? "Downloading…" : "Download image"}
          </Button>
        </section>
      {/if}

      <div class="links">
        {#if fw.demo}
          <Button kind="secondary" href={fw.demo} external>
            <Icon name="play_circle" size={22} />
            Try in the emulator
          </Button>
        {/if}
        {#if fw.video}
          <Button kind="secondary" href={fw.video} external>
            <Icon name="smart_display" size={22} />
            Watch the video
          </Button>
        {/if}
        {#if fw.source}
          <Button kind="secondary" href={fw.source} external>
            <Icon name="code" size={22} />
            Source
          </Button>
        {/if}
      </div>

      {#if fw.description}
        <section>
          <Prose source={fw.description} />
        </section>
      {/if}

      {#if $canFlash && fw.image}
        <!-- open to accounts a superuser marked as flashers only (auth.model $canFlash) -->
        <section class="how flash">
          <h2>Flash to the watch</h2>
          <ul class="checklist">
            <li>The watch is on its charger, at {OTA_MIN_BATTERY}% or more</li>
            <li>The phone's Bluetooth is off, so it can't grab the watch mid-update</li>
            <li>This tab stays open and the computer stays awake and close by</li>
          </ul>
          {#if !$watch}
            <Button
              size="large"
              kind="secondary"
              onClick={() => connectRequested()}
              disabled={$connecting}
            >
              <Icon name="bluetooth" size={22} />
              {$connecting ? "Connecting…" : "Connect the watch"}
            </Button>
          {:else}
            <p class="watch-line">
              {$watch.name ?? "Watch"}
              {#if $watch.firmware}· firmware {$watch.firmware}{/if}
              {#if $watch.battery !== null}· {$watch.battery}%{/if}
            </p>
            <!-- what the stub reports; the watch says 1.0.0.73 either way (see wp2.ts) -->
            <p class="watch-line">
              {#if $wp2Reading}
                Checking what the watch runs…
              {:else if $wp2 === "stock"}
                Stock firmware, no App Loader
              {:else if $wp2}
                App Loader stub {$wp2.stub.version}
                {#if $wp2.loader}· loader v{$wp2.loader.version}{:else}· no loader installed{/if}
                · {Object.keys($wp2.apps).length} apps
              {/if}
            </p>
            {#if $onWatch === "update"}
              <div><Badge>Update available</Badge></div>
            {:else if $onWatch === "installed"}
              <div><Badge quiet>Already on your watch</Badge></div>
            {/if}
            {#if $result === "done"}
              <p class="ok">
                <Icon name="check_circle" size={20} /> Sent. The watch installs it and restarts on its
                own — leave it on the charger until it's back.
              </p>
            {:else}
              <Button
                size="large"
                kind="danger"
                onClick={() => flashRequested()}
                disabled={!$riskAccepted || busy}
              >
                <Icon name="bolt" size={22} />
                {$imageFetching
                  ? "Fetching the image…"
                  : $flashing
                    ? "Flashing…"
                    : "Flash to the watch"}
              </Button>
              {#if !$riskAccepted}<p class="muted">Tick the box above first.</p>{/if}
            {/if}
          {/if}
          {#if $flashing}
            <progress max="100" value={$progress ?? undefined}></progress>
            <p class="muted">{$bleStatus} Don't close this tab.</p>
          {/if}
          {#if error}<p class="err">{error}</p>{/if}
        </section>
      {:else}
        <section class="how">
          <!-- flashing is the step FMC doesn't do yet — said at the step itself, with the
             button it will be, so nobody hunts for it -->
          <h2>Flash it <Badge>Coming soon</Badge></h2>
          <Button size="large" disabled>
            <Icon name="bolt" size={22} />
            Flash to the watch
          </Button>
          <p>
            Flashing straight from this page is still in the works. Until it lands, it happens with
            the community's command-line tools. Their guide covers pairing, the transfer and what to
            do when it goes wrong.
          </p>
          <Button kind="secondary" href={WATCH_UTILS_DOCS} external>
            <Icon name="menu_book" size={22} />
            Open the flashing guide
          </Button>
        </section>
      {/if}

      <p class="dates">
        {#if fw.author}By {fw.author} ·{/if}
        Updated {day(fw.updated)}
      </p>
    {:else if $loading}
      <Skeleton height="12rem" />
      <Skeleton width="60%" height="2rem" />
      <Skeleton width="85%" height="1rem" />
      <Skeleton height="4rem" />
      <Skeleton height="10rem" />
    {:else}
      <p class="empty">Firmware not found.</p>
    {/if}
  </div>
</Page>

<style>
  .detail {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    max-width: 40rem;
    margin: 0 auto;
    padding: 1rem 1rem 2rem;
  }
  .cover {
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    border-radius: var(--border-radius);
    color: oklch(from var(--color-text) l c h / 70%);
    background:
      radial-gradient(
        circle at 25% 15%,
        oklch(from var(--color-accent) l c h / 30%),
        transparent 65%
      ),
      oklch(from var(--color-text) l c h / 6%);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    /* without a picture it is a band, not a poster — no reason to spend a screen on a wash */
    &.bare {
      aspect-ratio: auto;
      height: 6.5rem;
    }
  }
  .identity {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  h1 {
    margin: 0;
    font-size: 2rem;
    line-height: 1.15;
    overflow-wrap: anywhere;
  }
  .summary {
    margin: 0;
    line-height: 1.35;
  }
  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }
  .hint,
  .dates {
    margin: 0;
    font-size: 0.75rem;
    color: oklch(from var(--color-text) l c h / 55%);
  }
  section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  h2 {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    font-size: 1.375rem;
  }
  section p {
    margin: 0;
    line-height: 1.5;
  }
  section a:not(:global(.btn)) {
    color: var(--color-text);
    text-underline-offset: 0.2em;
  }
  .risk {
    padding: 1rem;
    border-radius: var(--border-radius);
    background: oklch(from var(--color-error) l c h / 10%);

    h2 :global(.icon) {
      color: var(--color-error);
    }
    a {
      text-decoration-color: var(--color-error);
    }
  }
  .accept {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    cursor: pointer;
    font-weight: 500;
  }
  .how {
    padding: 1rem;
    border-radius: var(--border-radius);
    background: oklch(from var(--color-text) l c h / 5%);

    > :global(.btn.kind__secondary) {
      align-self: flex-start;
    }
  }
  .checklist {
    margin: 0;
    padding-inline-start: 1.25rem;
    line-height: 1.6;
  }
  .watch-line,
  .muted {
    font-size: 0.75rem;
    color: oklch(from var(--color-text) l c h / 55%);
  }
  .ok {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
  }
  .err {
    color: var(--color-error);
  }
  progress {
    width: 100%;
    height: 0.375rem;
    accent-color: var(--color-accent);
  }
  .links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;

    &:empty {
      display: none;
    }
  }
  .empty {
    padding: 4rem 0;
    text-align: center;
    color: oklch(from var(--color-text) l c h / 55%);
  }
  @media (max-width: 767px) {
    .links > :global(*) {
      flex: 1 1 auto;
    }
  }
</style>
