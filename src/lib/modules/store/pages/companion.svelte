<script lang="ts">
  // The FMC Companion phone app: what it does and where to get it. The facts come from the
  // companion repo's README and docs/apps.md — keep them in step with it.
  import { Button } from "$lib/shared/components/button";
  import { Icon } from "$lib/shared/components/icon";
  import { Page } from "$lib/shared/components/page";

  const REPO = "https://github.com/fmctools/companion";
  // ponytail: GitHub's "latest release" page, not the .apk itself — the asset's name carries the
  // versionCode, so a direct link needs an API call; resolve it from api.github.com if one tap matters
  const APK = `${REPO}/releases/latest`;

  const features = [
    {
      icon: "storefront",
      title: "The FMC store",
      text: "Browse watch faces from fmc.tools and put them on the watch.",
    },
    {
      icon: "apps",
      title: "Watch apps",
      text: "See the apps on the watch and their settings, and which ones have an update.",
    },
    {
      icon: "cell_tower",
      title: "Phone services",
      text: "Watch apps can ask for calendar, location, weather, notifications and http. Each app gets its own switch for each service.",
    },
    {
      icon: "system_update",
      title: "Firmware updates",
      text: "Update the watch firmware over the stock OTA.",
    },
    {
      icon: "link",
      title: "No pairing popup",
      text: "It rides the link Nothing X already holds, and Nothing X keeps working.",
    },
  ];
</script>

<svelte:head>
  <title>FMC Companion — FMC</title>
  <meta
    name="description"
    content="FMC Companion: the phone app for the CMF Watch Pro 2 and the FMC store. Watch faces, watch apps, phone services and firmware updates."
  />
</svelte:head>

<Page>
  <article>
    <h1>FMC Companion</h1>
    <p class="lead">
      The phone app for the CMF Watch Pro 2 and the FMC store. Open source under MIT, for Android
      and iOS.
    </p>

    <div class="actions">
      <Button href={APK} external size="large">
        <Icon name="android" />
        Download APK
      </Button>
      <Button kind="secondary" size="large" disabled>
        <Icon name="phone_iphone" />
        iOS TestFlight · Coming soon
      </Button>
    </div>

    <p class="beta">
      <strong>Android is a beta.</strong> Needs Android 12 or newer. The Bluetooth link on Android
      hasn't been tested on a real watch yet, so expect rough edges and
      <a href="{REPO}/issues" target="_blank" rel="noopener noreferrer">tell us</a> what breaks.
    </p>

    <ul class="features">
      {#each features as f (f.title)}
        <li>
          <span class="glyph"><Icon name={f.icon} size={22} /></span>
          <span>
            <strong>{f.title}</strong>
            <span class="text">{f.text}</span>
          </span>
        </li>
      {/each}
    </ul>

    <h2>Before you start</h2>
    <ul class="notes">
      <li>Made for the CMF Watch Pro 2.</li>
      <li>Installing a watch face needs Nothing X closed first.</li>
      <li>
        The APK is signed and built by CI from every Android change; GitHub lists every build on the
        releases page.
      </li>
    </ul>

    <footer>
      <a href={REPO} target="_blank" rel="noopener noreferrer">
        <Icon name="code" size={18} />
        Source on GitHub
        <Icon name="open_in_new" size={16} />
      </a>
      <a href="/privacy">
        <Icon name="shield" size={18} />
        Privacy policy
      </a>
    </footer>
  </article>
</Page>

<style>
  article {
    max-width: 40rem;
    margin: 0 auto;
    padding: 2rem 1rem 3rem;
  }
  h1 {
    margin: 0 0 0.5rem;
    font-family: var(--font-display);
    font-size: 1.75rem;
  }
  h2 {
    margin: 2rem 0 0.75rem;
    font-size: 1.125rem;
  }
  .lead {
    margin: 0 0 1.5rem;
    line-height: 1.6;
    color: oklch(from var(--color-text) l c h / 75%);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;

    & :global(.btn) {
      flex: 1 1 14rem;
    }
  }
  .beta {
    margin: 1rem 0 0;
    padding: 0.75rem 1rem;
    border: 1px solid oklch(from var(--color-accent) l c h / 40%);
    border-radius: var(--border-radius);
    background: oklch(from var(--color-accent) l c h / 6%);
    font-size: 0.875rem;
    line-height: 1.5;
  }
  a {
    color: var(--color-accent);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .features {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 2rem;

    li {
      display: flex;
      gap: 0.75rem;
      line-height: 1.5;
    }
    strong {
      display: block;
    }
  }
  .text {
    color: oklch(from var(--color-text) l c h / 70%);
  }
  .glyph {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 50%;
    background: oklch(from var(--color-text) l c h / 6%);
    color: var(--color-accent);
  }
  .notes {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-left: 1.25rem;
    list-style: disc;
    line-height: 1.6;

    li::marker {
      color: oklch(from var(--color-text) l c h / 45%);
    }
  }
  footer {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1.5rem;
    margin-top: 2rem;

    a {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--color-text);
      text-decoration: none;
    }
  }
</style>
