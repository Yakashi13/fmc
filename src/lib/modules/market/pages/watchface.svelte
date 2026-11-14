<script lang="ts">
  import { Avatar } from "$lib/shared/components/avatar";
  import { Badge } from "$lib/shared/components/badge";
  import { Button } from "$lib/shared/components/button";
  import { Icon } from "$lib/shared/components/icon";
  import { Skeleton } from "$lib/shared/components/skeleton";
  import { downloadUrl, fileUrl } from "$lib/shared/api";
  import { authModel } from "$lib/modules/auth/model";
  import { bleModel } from "$lib/modules/device/model";
  import { marketModel } from "../model";
  import { faceTitle } from "$lib/shared/seo";
  import { LiveDial } from "../components/live-dial";
  import { BackBtn } from "$lib/shared/components/back-btn";
  import { Page } from "$lib/shared/components/page";
  import { StatStrip } from "$lib/shared/components/stat-strip";
  import { compact, day } from "$lib/shared/lib/format";
  import { deviceLabel } from "../lib/devices";
  import { blur } from "svelte/transition";

  interface Props {
    id: string;
  }
  const { id }: Props = $props();

  const { $user: user } = authModel;
  const {
    $watchface: watchface,
    $watchfaceLoading: loading,
    $live: live,
    $dialScreen: dialScreen,
    $hasAod: hasAod,
    $installing: installing,
    $installed: installed,
    $likes: likes,
    $marketErr: marketErr,
    watchfaceRequested,
    installRequested,
    likeToggleRequested,
    editRequested,
    dialScreenSet,
  } = marketModel;
  const {
    $bleInfo: bleInfo,
    $bleStatus: bleStatus,
    $connecting: connecting,
    connectRequested,
  } = bleModel;

  $effect(() => {
    watchfaceRequested(id);
  });

  const wf = $derived($watchface);
  const device = $derived(deviceLabel(wf?.device));
  const owner = $derived(wf?.expand?.owner);
  const likeCount = $derived($likes.filter((l) => l.watchface === id).length);
  const liked = $derived($likes.some((l) => l.watchface === id && l.user === $user?.id));

  // ponytail: Web Share where it exists, clipboard everywhere else — no share-sheet dependency
  let copied = $state(false);

  async function share() {
    const url = location.href;

    if (navigator.share) {
      // a dismissed share sheet rejects — that's a cancel, not an error
      await navigator.share({ title: wf?.name, url }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url);
    copied = true;
  }
</script>

<!-- matches the title scripts/seo.ts bakes into this page's HTML: Google indexes the rendered
     one, an unfurler only ever sees the baked one -->
<svelte:head><title>{faceTitle(wf?.name || "Watchface")}</title></svelte:head>

<Page>
  <div class="detail">
    {#if $marketErr}<p class="error">{$marketErr}</p>{/if}

    <!-- back on one side, the two things you do to a face you like on the other -->
    <div class="topbar">
      <BackBtn href="/" />
      {#if wf}
        <div class="quick">
          <button class="round" title="Share" aria-label="Share" onclick={share}>
            <Icon name={copied ? "check" : "ios_share"} size={22} />
          </button>
          <button
            class="round like"
            title={$user ? "Like" : "Sign in to like"}
            aria-label="Like"
            aria-pressed={liked}
            disabled={!$user}
            onclick={() => $user && likeToggleRequested({ wf, userId: $user.id })}
          >
            <Icon
              name="favorite"
              size={22}
              color={liked ? "var(--color-error)" : undefined}
              fill={liked}
            />
            {compact(likeCount)}
          </button>
        </div>
      {/if}
    </div>

    {#if wf}
      <article class="face">
        <div class="dial">
          <div class="preview">
            {#if $live}
              <LiveDial face={$live} screen={$dialScreen} />
            {:else}
              <img src={fileUrl(wf, "preview")} alt={wf.name} />
            {/if}
          </div>
          {#if $hasAod}
            <button
              class="round toggle-aod"
              class:on={$dialScreen === "aod"}
              title={$dialScreen === "aod" ? "Show the main screen" : "Show the always-on screen"}
              aria-label="Toggle the always-on screen"
              onclick={() => dialScreenSet($dialScreen === "aod" ? "main" : "aod")}
            >
              {#key $dialScreen}
                <div transition:blur={{ duration: 200 }}>
                  <Icon name={$dialScreen === "aod" ? "monitor" : "dark_mode"} size={22} />
                </div>
              {/key}
            </button>
          {/if}
        </div>

        <div class="info">
          <header class="identity">
            <h1 class="name">{wf.name}</h1>
            <div class="byline">
              {#if owner}
                <a class="author" href="/user/{wf.owner}" title="Watchfaces by this creator">
                  <Avatar name={owner.name || "?"} />
                  <span>{owner.name || "Unknown"}</span>
                </a>
              {/if}
              {#if wf.type}<Badge>{wf.type}</Badge>{/if}
              {#if device}<Badge quiet>{device}</Badge>{/if}
            </div>
          </header>

          <!-- one accent button: getting the face onto the watch. Everything else is quieter. -->
          <div class="actions">
            <div class="primary">
              {#if !$bleInfo}
                <Button size="large" onClick={() => connectRequested()} disabled={$connecting}>
                  <Icon name="bluetooth" size={22} />
                  {$connecting ? "Connecting…" : "Connect watch to install"}
                </Button>
              {:else if $installed}
                <Button size="large" disabled>
                  <Icon name="check" size={22} /> Installed
                </Button>
                <Button
                  size="large"
                  kind="secondary"
                  onClick={() => installRequested(wf)}
                  disabled={$installing}
                >
                  Install again
                </Button>
              {:else}
                <Button size="large" onClick={() => installRequested(wf)} disabled={$installing}>
                  <Icon name="watch" size={22} />
                  {$installing ? "Installing…" : "Install watchface"}
                </Button>
              {/if}
            </div>
            <div class="secondary">
              <Button kind="secondary" onClick={() => editRequested(wf)}>
                <Icon name="edit" size={22} />
                <span>Open in editor</span>
              </Button>
              <Button kind="secondary" href={downloadUrl(wf)}>
                <Icon name="download" size={22} />
                <span>Download .bin</span>
              </Button>
            </div>
          </div>

          <StatStrip
            items={[
              { label: "Likes", value: compact(likeCount) },
              { label: "Downloads", value: compact(wf.downloads) },
              { label: "Flashed", value: compact(wf.flashes) },
            ]}
          />

          {#if wf.description}
            <p class="desc">{wf.description}</p>
          {/if}

          <p class="dates">
            Published {day(wf.created)}
            {#if day(wf.updated) !== day(wf.created)}· updated {day(wf.updated)}{/if}
          </p>
        </div>
      </article>
    {:else if $loading}
      <div class="face">
        <div class="dial"><div class="preview"><Skeleton height="100%" /></div></div>
        <div class="info">
          <Skeleton height="2.25rem" width="60%" />
          <Skeleton height="1.25rem" width="40%" />
          <Skeleton height="3rem" />
          <Skeleton height="2.5rem" />
          <Skeleton height="4rem" />
        </div>
      </div>
    {:else}
      <p class="empty">Watchface not found.</p>
    {/if}
  </div>
</Page>

<style>
  .detail {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 62rem;
    margin: 0 auto;
    padding: 1rem 1rem 2rem;
  }
  .error {
    margin: 0;
    font-size: 0.75rem;
    color: var(--color-error);
  }
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .quick {
    display: flex;
    gap: 0.5rem;
  }
  /* the page's small round controls: share, like, the always-on toggle */
  .round {
    appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    min-width: 2.5rem;
    height: 2.5rem;
    padding: 0 0.625rem;
    border: none;
    border-radius: 10em;
    font: inherit;
    font-size: 0.875rem;
    font-variant-numeric: tabular-nums;
    color: var(--color-text);
    background: oklch(from var(--color-text) l c h / 8%);
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      transform var(--spring-transition);

    @media (hover: hover) {
      &:hover:not(:disabled) {
        background: oklch(from var(--color-text) l c h / 14%);
      }
    }
    &:active:not(:disabled) {
      transform: scale(0.94);
    }
    &:disabled {
      cursor: default;
      color: oklch(from var(--color-text) l c h / 55%);
    }
  }
  .face {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .dial {
    position: relative;
    align-self: center;
    width: min(100%, 20rem);
  }
  .preview {
    aspect-ratio: 1 / 1;
    overflow: hidden;
    border-radius: 50%;
    background: oklch(0 0 0);

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
  /* tucked into the square's free corner, off the dial itself */
  .toggle-aod {
    position: absolute;
    right: 0;
    top: 0;
    padding: 0;
    background-color: var(--color-text);
    color: var(--color-background);

    & :global(.icon) {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    &.on {
      background-color: oklch(from var(--color-text) l c h / 8%);
      color: var(--color-text);
    }
    @media (hover: hover) {
      &:hover:not(:disabled) {
        background-color: oklch(from var(--color-text) l c h / 85%);
      }
      &.on:hover:not(:disabled) {
        background-color: oklch(from var(--color-text) l c h / 14%);
      }
    }
  }
  .info {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    min-width: 0;
  }
  .identity {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .name {
    margin: 0;
    font-size: 2.25rem;
    line-height: 1.1;
    overflow-wrap: anywhere;
  }
  .byline {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }
  .author {
    --avatar-size: 1.5rem;

    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    margin-inline-end: 0.25rem;
    font-weight: 500;
    color: var(--color-text);
    text-decoration: none;

    span {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    @media (hover: hover) {
      &:hover span {
        text-decoration: underline;
        text-decoration-color: var(--color-accent);
        text-underline-offset: 0.2em;
      }
    }
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .primary,
  .secondary {
    display: flex;
    gap: 0.5rem;

    > :global(*) {
      flex: 1;
      min-width: 0;
    }
    :global(span:not(.icon)) {
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
  }
  /* side by side while both labels fit, stacked on a narrow phone rather than cut short */
  .secondary {
    flex-wrap: wrap;

    > :global(*) {
      flex: 1 1 10rem;
    }
  }
  .desc {
    margin: 0;
    white-space: pre-wrap;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
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
  /* room for both: the dial stays in view on the left while the details scroll beside it */
  @media (min-width: 900px) {
    .detail {
      padding: 1.5rem 2rem 3rem;
    }
    .face {
      display: grid;
      grid-template-columns: minmax(0, 24rem) minmax(0, 30rem);
      justify-content: center;
      align-items: start;
      gap: 3.5rem;
    }
    .dial {
      position: sticky;
      top: 1rem;
      width: 100%;
    }
  }
</style>
