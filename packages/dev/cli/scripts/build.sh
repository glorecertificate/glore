#!/usr/bin/env sh

. "$(dirname "$0")/../shared/utils.sh"

if ! sh "$(dirname "$0")/typegen.sh" >/dev/null 2>&1; then
  print_error "Type generation failed"
  exit 1
fi

next build
