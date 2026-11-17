<script lang="ts">
  // Markdown from a record (an app's, a firmware's or a watchface's description) as styled prose.
  //
  // The text comes from the database, so it gets its own parser rather than the global one:
  // raw HTML is printed as text instead of being injected, and a link or image may only point
  // at the web. That leaves {@html} with nothing but the tags marked itself emits. Bare URLs
  // become links on their own (GFM autolinks); a link off the site opens in a new tab.
  //
  // `ugc`: text any user wrote (a watchface's description): its single line breaks are kept,
  // since it was typed as plain text long before it rendered as markdown, and its links are
  // nofollow, so the shelf isn't a place to buy search rank.
  import { Marked, type Tokens } from "marked";

  interface Props {
    source: string;
    ugc?: boolean;
  }
  const { source, ugc = false }: Props = $props();

  const escape = (s: string) =>
    s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  const SAFE_URL = /^(https?:|mailto:|\/|#)/i;

  const make = (rel: string, breaks: boolean) =>
    new Marked({
      breaks,
      renderer: {
        html: ({ text }) => escape(text),
        link({ href, title, tokens }: Tokens.Link) {
          const away = /^https?:/i.test(href) ? ` target="_blank" rel="${rel}"` : "";
          const t = title ? ` title="${escape(title)}"` : "";

          return `<a href="${escape(href)}"${t}${away}>${this.parser.parseInline(tokens)}</a>`;
        },
      },
      walkTokens(token) {
        if ((token.type === "link" || token.type === "image") && !SAFE_URL.test(token.href))
          token.href = "#";
      },
    });
  const curated = make("noopener", false);
  const users = make("nofollow ugc noopener", true);

  const html = $derived((ugc ? users : curated).parse(source, { async: false }));
</script>

<div class="prose">{@html html}</div>

<style>
  .prose {
    line-height: 1.6;
    overflow-wrap: anywhere;

    :global {
      > :first-child {
        margin-top: 0;
      }
      > :last-child {
        margin-bottom: 0;
      }
      h1,
      h2,
      h3,
      h4 {
        margin: 1.5rem 0 0.5rem;
        font-family: var(--font-family);
        font-stretch: normal;
        font-size: 1rem;
        font-weight: 600;
      }
      p {
        margin: 0 0 0.75rem;
      }
      /* a note the reader must not miss ("works only with…"): an accent plate, not an indent */
      blockquote {
        margin: 0 0 1rem;
        padding: 0.75rem 1rem;
        border-left: 3px solid var(--color-accent);
        border-radius: calc(var(--border-radius) / 2);
        background: oklch(from var(--color-accent) l c h / 10%);

        p:last-child {
          margin-bottom: 0;
        }
      }
      ul,
      ol {
        margin: 0 0 0.75rem;
        padding-left: 1.25rem;
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
      }
      li::marker {
        color: oklch(from var(--color-text) l c h / 45%);
      }
      code {
        font-family: var(--font-mono);
        font-size: 0.875em;
        padding: 0.1em 0.35em;
        border-radius: 0.3rem;
        background: oklch(from var(--color-text) l c h / 8%);
      }
      pre {
        margin: 0 0 0.75rem;
        padding: 0.75rem;
        overflow-x: auto;
        border-radius: var(--border-radius);
        background: oklch(from var(--color-text) l c h / 6%);

        code {
          padding: 0;
          background: none;
        }
      }
      a {
        color: var(--color-text);
        text-decoration-color: var(--color-accent);
        text-underline-offset: 0.2em;
      }
      img {
        max-width: 100%;
        border-radius: var(--border-radius);
      }
    }
  }
</style>
