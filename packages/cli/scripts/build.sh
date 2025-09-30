#!/usr/bin/env sh

. "$(dirname "$0")"/../init.sh

cd_app

if ! $CLI typegen >/dev/null 2>&1; then
  exit_with_error "Type generation failed"
fi

next build

