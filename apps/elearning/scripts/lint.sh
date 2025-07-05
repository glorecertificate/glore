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
    ./node_modules/.bin/eslint --fix $ESLINT_GLOBS
    ./node_modules/.bin/prettier --write $PRETTIER_GLOBS
    ;;
  "")
    ./node_modules/.bin/eslint $ESLINT_GLOBS
    ./node_modules/.bin/prettier --check $PRETTIER_GLOBS
    ./node_modules/.bin/shellcheck $SHELLCHECK_GLOBS
    ;;
  *)
    exit 1
    ;;
esac
