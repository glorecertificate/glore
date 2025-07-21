#!/usr/bin/env sh
# shellcheck disable=SC2086

ESLINT_GLOBS="."
PRETTIER_GLOBS="*.* src supabase"
SHELLCHECK_GLOBS="scripts/*"

if [ "$CI" = "true" ] || [ "$CI" = 1 ] || [ "$GITHUB_ACTIONS" = "true" ]; then
  ESLINT_GLOBS="src"
fi

case "$1" in
  --fix)
    eslint --fix $ESLINT_GLOBS
    prettier --write $PRETTIER_GLOBS
    ;;
  "")
    eslint $ESLINT_GLOBS && prettier --check $PRETTIER_GLOBS && shellcheck $SHELLCHECK_GLOBS
    ;;
  *)
    exit 1
    ;;
esac
