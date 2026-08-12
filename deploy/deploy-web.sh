#!/usr/bin/env bash
#
# Deploy the Angular admin app to the pre-production server.
#
#   export DENTAL_SERVER=deploy@62.238.37.26
#   ./deploy/deploy-web.sh
#
# This script used to live in the API repository, which meant the frontend's
# deploy logic sat next to code it could not build. It now lives beside the app
# it ships, and .github/workflows/deploy-preprod.yml runs it unchanged — there
# is one implementation of "deploy the frontend", so the manual path stays a
# working escape hatch and cannot drift from what CI does.
#
# Assumes the branch is already pushed. The usual sequence is:
#   git checkout preprod && git pull
#   git merge --no-ff develop -m "preprod: cut build $(date +%F)"
#   git push
#   ./deploy/deploy-web.sh
set -euo pipefail

SERVER="${DENTAL_SERVER:?Set DENTAL_SERVER, e.g. export DENTAL_SERVER=deploy@62.238.37.26}"
REMOTE_DIR="${DENTAL_REMOTE_DIR:-/opt/dental}"
BRANCH="${DENTAL_BRANCH:-preprod}"

cd "$(dirname "$0")/.."
echo "==> Frontend repo: $(pwd)"

# Guards against rsyncing a develop build by hand. Skipped under CI, where the
# workflow has already checked out an explicit ref and the resulting detached
# HEAD makes `git branch --show-current` return nothing at all.
if [[ -z "${CI:-}" ]]; then
	CURRENT_BRANCH="$(git branch --show-current)"
	if [[ "$CURRENT_BRANCH" != "$BRANCH" ]]; then
		echo "!! On branch '${CURRENT_BRANCH}', expected '${BRANCH}'." >&2
		echo "!! git checkout ${BRANCH} && git pull" >&2
		exit 1
	fi
else
	echo "==> CI detected, skipping the branch check"
fi

echo "==> Installing dependencies"
npm ci

# --base-href / because the bundle is served from the domain root by Caddy's
# file_server, not from a subpath.
echo "==> Building (configuration: preprod, base-href: /)"
npx ng build --configuration preprod --base-href /

DIST="dist/dental-ordination/browser"
[[ -f "${DIST}/index.html" ]] || { echo "!! ${DIST}/index.html missing" >&2; exit 1; }

echo "==> Syncing to ${SERVER}:${REMOTE_DIR}/www"
# --delete removes stale hashed bundles from previous builds. Safe: this
# directory holds only build output. It also matters for correctness — index.html
# references bundles by content hash, so leftovers from an older build are dead
# weight that nothing will ever request again.
rsync -avz --delete "${DIST}/" "${SERVER}:${REMOTE_DIR}/www/"

ADMIN_HOST="$(ssh "$SERVER" "grep -E '^ADMIN_HOST=' ${REMOTE_DIR}/.env | cut -d= -f2-")"

echo "==> Verifying the deployed bundle is reachable"
# Deliberately shallow, and worth naming as such: this proves Caddy is serving
# an index.html, not that the app boots or that it can reach the API.
if curl -fsS -o /dev/null "https://${ADMIN_HOST}/"; then
	echo "==> Deploy complete: https://${ADMIN_HOST}"
else
	echo "!! https://${ADMIN_HOST}/ did not respond. The files are synced; check Caddy:" >&2
	echo "   ssh ${SERVER} 'cd ${REMOTE_DIR}/app && docker compose --env-file ${REMOTE_DIR}/.env logs --tail=50 caddy'" >&2
	exit 1
fi
