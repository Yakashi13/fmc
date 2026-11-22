# FMC Frontend

Watch faces, apps, firmware and browser tools for CMF watches. SvelteKit (Svelte 5) SPA,
static build (`@sveltejs/adapter-static`). Backend — [`fmc_pocketbase`](../fmc_pocketbase)
(PocketBase), must be running for auth/marketplace to work.

Pages: the store — watchfaces (`/`, `/market/[id]`), apps (`/apps`) and firmware
(`/firmware`) — creator profiles (`/user/[id]`), the editor (`/editor`, with flashing a
watchface to the watch over Web Bluetooth), login/register (`/login`, `/register`).

## Development

```sh
pnpm install
pnpm dev
```

Open `http://localhost:5173`. Requires `fmc_pocketbase` running (`./pocketbase serve`,
see its `README.md`) — set `VITE_PB_URL` (e.g. in `.env`) to point at it directly, e.g.
`VITE_PB_URL=http://127.0.0.1:8090`.

Without `VITE_PB_URL` the client falls back to same-origin (`location.origin`), which is
what's used in prod behind Caddy.

### OAuth setup (one-time, optional)

Email login and registration work out of the box. For OAuth (Google/GitHub):

1. `cd ../fmc_pocketbase && ./pocketbase superuser upsert you@example.com <password>`
2. Open `http://127.0.0.1:8090/_/` → Collections → users → Options → OAuth2.
3. Enable the provider you need, fill in client id/secret (the admin panel shows the redirect URL).

## Build and deploy

```sh
pnpm build      # static output into build/
make deploy     # builds and rsyncs to the home server (ssh alias kuzyo)
```

`make deploy` uploads `build/` into `/srv/pets/fmc/www` on kuzyo (the `fmc_pocketbase`
stack inside the `pets` incus container) — served by Caddy. Prod infra details — in
[`fmc_pocketbase/README.md`](../fmc_pocketbase/README.md).

## Type checking and tests

```sh
pnpm check   # svelte-check
pnpm test    # round-trip test of the .bin parser/compiler against watchfaces/files/ fixtures
```

## License

[AGPL-3.0](LICENSE). The bundled Geist fonts are under the SIL Open Font License —
see [`static/fonts/OFL.txt`](static/fonts/OFL.txt).

Material Symbols Rounded is bundled locally under the [Apache 2.0 license](static/fonts/LICENSE-Material-Symbols.txt). Icons do not require Google Fonts requests.

## Branding assets

The original community logo is `static/branding/fmc-community.svg`. Navigation preserves the full artwork, including “by COMMUNITY”. Transparent SVG favicons adapt to the system light/dark preference. A stable 96px PNG and ICO provide non-themed fallbacks, with a contrasting edge for light and dark host surfaces. Installed-app icons keep a solid background for platform masking.

Run `pnpm brand-assets` to regenerate the icons and `pnpm og-card` to regenerate the default share card. These scripts use Playwright Chromium; set `PLAYWRIGHT_CHANNEL=msedge` to use an installed Edge instead. Keep device-specific support descriptions on their relevant pages.

Keep `/favicon.png` stable for crawlers; do not rotate favicon URLs on every build. Browser and third-party caches refresh independently. Search results may take days to weeks to recrawl, and favicon changes are not guaranteed to appear immediately.
