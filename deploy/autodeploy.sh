#!/bin/sh
# Pull-based deploy on kuzyo: GitHub can't reach the home server, so the server polls.
# Run by fmc-autodeploy.timer every 5 min: when main moved and CI on that commit is green,
# build it in a node container and rsync build/ into the www dir fmc-caddy serves.
# Install: see deploy/README.md. Manual `make deploy` still works alongside it.
set -eu

REPO=fmctools/fmc
WWW=/srv/pets/fmc/www
STATE=/var/lib/fmc-autodeploy
SRC=$STATE/src

mkdir -p "$STATE"
sha=$(git ls-remote "https://github.com/$REPO" refs/heads/main | cut -f1)
[ -n "$sha" ] || { echo "ls-remote returned nothing"; exit 1; }
[ "$sha" = "$(cat "$STATE/deployed" 2>/dev/null)" ] && exit 0

# ponytail: unauthenticated API (60 req/h), one call per new commit; a token if that ever bites
runs=$(curl -fsSL "https://api.github.com/repos/$REPO/actions/runs?head_sha=$sha&event=push")
if ! echo "$runs" | grep -q '"conclusion": "success"'; then
  echo "$sha: CI not green yet, waiting"
  exit 0
fi

[ -d "$SRC/.git" ] || git clone -q "https://github.com/$REPO" "$SRC"
git -C "$SRC" fetch -q origin main
git -C "$SRC" checkout -qf "$sha"
git -C "$SRC" clean -qfdx -e node_modules

# Same env as `make deploy`: same-origin PocketBase, public Aptabase key.
# --network host: the default bridge has no working DNS on kuzyo.
docker run --rm --network host -v "$SRC:/app" -v fmc-pnpm-store:/pnpm -w /app \
  -e VITE_PB_URL= -e VITE_APTABASE_KEY=A-SH-4670014985 -e CI=1 \
  node:24-slim sh -c 'npm i -g pnpm@11 && pnpm config set store-dir /pnpm && pnpm install --frozen-lockfile && pnpm run build'

rsync -rlt --delete "$SRC/build/" "$WWW/"
echo "$sha" > "$STATE/deployed"
echo "deployed $sha"
