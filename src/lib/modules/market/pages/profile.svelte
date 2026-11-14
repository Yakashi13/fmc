<script lang="ts">
  import { Avatar } from "$lib/shared/components/avatar";
  import { Button } from "$lib/shared/components/button";
  import { Icon } from "$lib/shared/components/icon";
  import { Page } from "$lib/shared/components/page";
  import { Skeleton } from "$lib/shared/components/skeleton";
  import { StatStrip } from "$lib/shared/components/stat-strip";
  import { compact } from "$lib/shared/lib/format";
  import { fileUrl } from "$lib/shared/api";
  import { marketModel } from "../model";
  import { creatorTitle } from "$lib/shared/seo";
  import { WatchfaceList } from "../components/watchface-list";
  import { authModel, profileModel } from "$lib/modules/auth/model";
  import ProfileEditor from "$lib/modules/auth/components/profile-editor.svelte";

  interface Props {
    userId: string;
  }
  const { userId }: Props = $props();

  const {
    $profile: profile,
    $profileItems: profileItems,
    $profileLoading: profileLoading,
    $likes: likes,
    $marketErr: marketErr,
    profileLoadRequested,
  } = marketModel;
  const { $user: user } = authModel;
  const { profileEditOpened } = profileModel;

  $effect(() => {
    profileLoadRequested(userId);
  });

  const own = $derived($user?.id === userId);
  const name = $derived($profile?.name || "Creator");
  const avatar = $derived($profile?.avatar ? fileUrl($profile, "avatar") : undefined);
  const joined = $derived(
    $profile
      ? new Date($profile.created).toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
        })
      : "",
  );
  const likeCount = (id: string) => $likes.filter((l) => l.watchface === id).length;
  const totalLikes = $derived($profileItems.reduce((n, wf) => n + likeCount(wf.id), 0));
  const totalDownloads = $derived($profileItems.reduce((n, wf) => n + (wf.downloads || 0), 0));
</script>

<svelte:head><title>{creatorTitle(name)}</title></svelte:head>

<Page>
  {#if $marketErr}<p class="error">{$marketErr}</p>{/if}

  <header class="profile">
    {#if $profile}
      <div class="who">
        <Avatar {name} src={avatar} />
        <div class="identity">
          <h1>{name}</h1>
          <p class="meta">Joined {joined}</p>
        </div>
        {#if own}
          <Button kind="secondary" onClick={() => profileEditOpened()}>
            <Icon name="edit" size={18} />
            <span class="edit-label">Edit profile</span>
          </Button>
        {/if}
      </div>
      {#if $profile.bio}<p class="bio">{$profile.bio}</p>{/if}
      <div class="stats">
        <StatStrip
          items={[
            { label: "Watchfaces", value: $profileItems.length },
            { label: "Likes", value: compact(totalLikes) },
            { label: "Downloads", value: compact(totalDownloads) },
          ]}
        />
      </div>
    {:else if $profileLoading}
      <div class="who">
        <Skeleton height="4.5rem" width="4.5rem" />
        <div class="identity">
          <Skeleton height="1.5rem" width="10rem" />
          <Skeleton height="0.875rem" width="7rem" />
        </div>
      </div>
      <Skeleton height="3.75rem" />
    {/if}
  </header>

  <WatchfaceList
    items={$profileItems}
    loading={$profileLoading}
    showAuthor={false}
    empty="Nothing published yet."
  />
</Page>

{#if own}<ProfileEditor />{/if}

<style>
  .error {
    margin: 0;
    padding: 0.75rem 1rem 0;
    font-size: 0.75rem;
    color: var(--color-error);
  }
  .profile {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem 1rem 0.5rem;
  }
  .who {
    --avatar-size: 4.5rem;

    display: flex;
    align-items: center;
    gap: 1rem;

    :global(.skeleton:first-child) {
      flex: none;
      border-radius: 50%;
    }
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
    font-size: 1.75rem;
    line-height: 1.15;
    overflow-wrap: anywhere;
  }
  .bio {
    margin: 0;
    max-width: 40rem;
    line-height: 1.5;
    white-space: pre-line;
    overflow-wrap: anywhere;
  }
  .meta {
    margin: 0;
    font-size: 0.75rem;
    color: oklch(from var(--color-text) l c h / 55%);
  }
  .stats {
    max-width: 26rem;
  }
  @media (max-width: 767px) {
    .profile {
      padding: 1rem 0.75rem 0.25rem;
    }
    /* the pencil alone: the name needs the row more than the label does */
    .edit-label {
      display: none;
    }
  }
</style>
