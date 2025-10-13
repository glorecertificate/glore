#!/usr/bin/env sh

. "$(dirname "$0")"/../init.sh

$CLI typegen >/dev/null 2>&1
next build
