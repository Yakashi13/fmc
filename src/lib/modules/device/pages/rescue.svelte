<script lang="ts">
  // Linked from the troubleshooting page for a watch that boots to a black screen but still
  // advertises. Two actions, sent right after auth: delete the faces this browser installed, or
  // factory reset. Either keeps reconnecting until it goes through or the user stops it.
  import { Button } from "$lib/shared/components/button";
  import { rescueModel } from "../model";
  import { Textarea } from "$lib/shared/components/textarea";
  import { t } from "../i18n";

  const ISSUES = "https://github.com/fmctools/fmc/issues";

  const {
    resetRequested,
    facesRequested,
    stockRequested,
    stopRequested,
    keyTextChanged,
    keySubmitted,
    $keyText: keyText,
    $keyed: keyed,
    $keyImported: keyImported,
    $keyRejected: keyRejected,
    $faces: faces,
    $status: status,
    $error: error,
    $done: done,
    $busy: busy,
    $log: log,
  } = rescueModel;
  const copy = () => navigator.clipboard.writeText($log.join("\n")).catch(() => {});
</script>

<svelte:head>
  <title>{$t.rescueTitle}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="page">
  <article>
    <h1 class="type-title">{$t.rescue}</h1>
    <!-- our own dictionary, so {@html} is safe -->
    <p>{@html $t.rescueIntro}</p>
    <p>{$t.rescueBrowser}</p>
    {#if !$keyed}
      <p class="error">{$t.rescueNoKey}</p>
      <p>{$t.rescueKeyHint}</p>
      <div class="key">
        <Textarea
          value={$keyText}
          rows={2}
          placeholder="fmc_authkey=…"
          onInput={(text) => keyTextChanged(text)}
        />
      </div>
      <Button kind="secondary" onClick={() => keySubmitted()}>{$t.rescueKeySave}</Button>
      {#if $keyRejected}<p class="error">{$t.rescueKeyBad}</p>{/if}
    {:else if $keyImported}
      <p class="status">{$t.rescueKeySaved}</p>
    {/if}
    {#if $busy}
      <Button kind="secondary" onClick={() => stopRequested()}>{$t.stopRescue}</Button>
    {:else}
      <p>{$t.stockFaceHint}</p>
      <Button kind="secondary" onClick={() => stockRequested()}>{$t.stockFace}</Button>
      {#if $faces}
        <p>{$t.deleteFacesHint}</p>
        <Button kind="secondary" onClick={() => facesRequested()}>{$t.deleteFaces($faces)}</Button>
      {/if}
      <Button kind="danger" onClick={() => resetRequested()}>{$t.factoryReset}</Button>
    {/if}
    {#if $status}<p class="status">{$status}</p>{/if}
    {#if $error}<p class="error">{$error}</p>{/if}
    {#if $done?.action === "reset"}
      <p class="status">{@html $t.rescueSent(ISSUES)}</p>
    {:else if $done?.action === "stock"}
      <p class="status">{$t.stockFaceDone}</p>
    {:else if $done?.action === "faces"}
      <p class="status">{$t.facesDeleted($done.deleted)}</p>
    {/if}
    {#if $log.length}
      <p>{$t.sendLog}</p>
      <Button kind="secondary" onClick={copy}>{$t.copyLog}</Button>
      <pre class="type-caption type-mono">{$log.join("\n")}</pre>
    {/if}
    <a class="back" href="/help">{$t.backToBefore}</a>
  </article>
</div>

<style>
  .page {
    height: 100%;
    overflow-y: auto;
  }
  article {
    max-width: 44rem;
    margin: 0 auto;
    padding: 2rem 1rem 4rem;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  h1 {
    margin: 0;
  }
  p {
    margin: 0;
  }
  .key {
    width: 100%;
  }
  .status {
    color: oklch(from var(--color-text) l c h / 55%);
  }
  .error {
    color: var(--color-error);
  }
  pre {
    width: 100%;
    max-height: 20rem;
    overflow: auto;
    padding: 0.75rem;
    border-radius: var(--border-radius);
    background: oklch(from var(--color-text) l c h / 6%);
    border: 1px solid oklch(from var(--color-text) l c h / 12%);
    white-space: pre-wrap;
    word-break: break-all;
  }
  .back {
    color: var(--color-text);
  }
</style>
