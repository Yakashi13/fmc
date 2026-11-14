<script lang="ts">
  // One app: what it is, the package, and how to get it onto the watch.
  import { BackBtn } from "$lib/shared/components/back-btn";
  import { Badge } from "$lib/shared/components/badge";
  import { Button } from "$lib/shared/components/button";
  import { Icon } from "$lib/shared/components/icon";
  import { Page } from "$lib/shared/components/page";
  import { Prose } from "$lib/shared/components/prose";
  import { Skeleton } from "$lib/shared/components/skeleton";
  import { StatStrip } from "$lib/shared/components/stat-strip";
  import { fileUrl, pb } from "$lib/shared/api";
  import { compact, day } from "$lib/shared/lib/format";
  import { deviceLabel } from "$lib/modules/market/lib/devices";
  import { APP_GUIDE } from "../lib/links";
  import { storeModel } from "../model";

  interface Props {
    id: string;
  }
  const { id }: Props = $props();

  const { $app: app, $appLoading: loading, appRequested, appDownloadUrl } = storeModel;

  $effect(() => {
    appRequested(id);
  });

  const stats = $derived(
    $app
      ? [
          ...($app.version ? [{ label: "Version", value: $app.version }] : []),
          ...($app.abi ? [{ label: "App ABI", value: $app.abi }] : []),
          { label: "Downloads", value: compact($app.downloads) },
        ]
      : [],
  );
  const shots = $derived<string[]>($app?.screenshots ?? []);
</script>

<svelte:head><title>{$app?.name ?? "App"} — app for the CMF Watch Pro 2</title></svelte:head>

<Page>
  <div class="detail">
    <BackBtn href="/apps" />

    {#if $app}
      <header class="head">
        {#if $app.icon}
          <img class="app-icon" src={fileUrl($app, "icon")} alt="" />
        {:else}
          <span class="app-icon letter">{$app.name.slice(0, 1)}</span>
        {/if}
        <div class="identity">
          <h1>{$app.name}</h1>
          {#if $app.summary}<p class="summary">{$app.summary}</p>{/if}
          <p class="by">
            {#if $app.author}{$app.author}{/if}
            {#if $app.author && deviceLabel($app.device)}·{/if}
            {deviceLabel($app.device)}
          </p>
        </div>
      </header>

      <div class="actions">
        {#if $app.package}
          <Button size="large" href={appDownloadUrl($app)}>
            <Icon name="download" size={22} />
            Download
          </Button>
        {/if}
        {#if $app.source}
          <Button size="large" kind="secondary" href={$app.source} external>
            <Icon name="code" size={22} />
            Source
          </Button>
        {/if}
      </div>

      <StatStrip items={stats} />

      {#if shots.length}
        <div class="shots">
          {#each shots as shot (shot)}
            <img src={pb.files.getURL($app, shot)} alt="{$app.name} on the watch" loading="lazy" />
          {/each}
        </div>
      {/if}

      {#if $app.description}
        <section>
          <Prose source={$app.description} />
        </section>
      {/if}

      <section class="how">
        <!-- installing is the step FMC doesn't do yet — said at the step itself, with the
             button it will be, so nobody hunts for it -->
        <h2>Install it <Badge>Coming soon</Badge></h2>
        <Button size="large" disabled>
          <Icon name="watch" size={22} />
          Install on the watch
        </Button>
        <p class="wip">
          Installing straight from this page is still in the works. Until it lands, the manual way:
        </p>
        <ol>
          <li>
            <span class="n">1</span>
            <span>
              Flash the <a href="/firmware">App Loader firmware</a> once. It adds an
              <b>Apps</b> row to the watch and the channel that installs packages.
            </span>
          </li>
          <li>
            <span class="n">2</span>
            <span>
              Send the package with the <code>wp2apps</code> tool:
              <code class="cmd">wp2apps install app.wp2app --address …</code>
              The address comes from <code>wp2apps scan</code>.
            </span>
          </li>
          <li>
            <span class="n">3</span>
            <span>
              Open <b>Apps</b> at the end of the watch's app list. It shows in the list style, not the
              waterfall.
            </span>
          </li>
        </ol>
        <p class="note">
          <a href={APP_GUIDE} target="_blank" rel="noopener noreferrer">Write your own app</a>
        </p>
      </section>

      <p class="dates">Updated {day($app.updated)}</p>
    {:else if $loading}
      <div class="head">
        <Skeleton width="5rem" height="5rem" />
        <div class="identity">
          <Skeleton width="60%" height="1.75rem" />
          <Skeleton width="85%" height="1rem" />
        </div>
      </div>
      <Skeleton height="3rem" />
      <Skeleton height="4rem" />
      <Skeleton height="8rem" />
    {:else}
      <p class="empty">App not found.</p>
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
  .head {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .app-icon {
    flex: none;
    width: 5.5rem;
    height: 5.5rem;
    border-radius: 50%;
    object-fit: cover;
    background: oklch(from var(--color-text) l c h / 8%);

    &.letter {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 2.25rem;
      font-weight: 600;
      text-transform: uppercase;
      color: oklch(from var(--color-text) l c h / 60%);
    }
  }
  .head :global(.skeleton:first-child) {
    flex: none;
    border-radius: 50%;
  }
  .identity {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
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
  .by {
    margin: 0;
    font-size: 0.875rem;
    color: oklch(from var(--color-text) l c h / 55%);
  }
  .actions {
    display: flex;
    gap: 0.5rem;

    > :global(*) {
      flex: 1;
      min-width: 0;
    }
  }
  /* watch screens, so round ones — a row that scrolls sideways, edge to edge on a phone */
  .shots {
    display: flex;
    gap: 0.75rem;
    margin-inline: -1rem;
    padding-inline: 1rem;
    overflow-x: auto;
    scroll-snap-type: x proximity;
    scrollbar-width: none;

    img {
      flex: none;
      width: 11rem;
      aspect-ratio: 1;
      border-radius: 50%;
      object-fit: cover;
      background: oklch(0 0 0);
      scroll-snap-align: center;
    }
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
    gap: 0.625rem;
    margin: 0;
    font-size: 1.375rem;
  }
  .wip {
    margin: 0;
    line-height: 1.5;
  }
  .how {
    padding: 1rem;
    border-radius: var(--border-radius);
    background: oklch(from var(--color-text) l c h / 5%);

    ol {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    li {
      display: flex;
      gap: 0.75rem;
      line-height: 1.5;

      /* the command line scrolls inside its own box instead of widening the step */
      > span:last-child {
        min-width: 0;
      }
    }
    a {
      color: var(--color-text);
      text-decoration-color: var(--color-accent);
      text-underline-offset: 0.2em;
    }
  }
  .n {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    font-size: 0.75rem;
    font-weight: 600;
    background: var(--color-accent);
    color: var(--color-on-accent);
  }
  code {
    font-family: var(--font-mono);
    font-size: 0.875em;
  }
  .cmd {
    display: block;
    margin-block: 0.375rem;
    padding: 0.5rem 0.625rem;
    overflow-x: auto;
    white-space: nowrap;
    border-radius: calc(var(--border-radius) / 2);
    background: oklch(from var(--color-text) l c h / 8%);
  }
  .note,
  .dates {
    margin: 0;
    font-size: 0.75rem;
    color: oklch(from var(--color-text) l c h / 55%);
  }
  .empty {
    padding: 4rem 0;
    text-align: center;
    color: oklch(from var(--color-text) l c h / 55%);
  }
</style>
