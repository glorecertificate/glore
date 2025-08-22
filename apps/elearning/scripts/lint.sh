#!/usr/bin/env sh
# shellcheck disable=SC2086

ESLINT_GLOBS="."
PRETTIER_GLOBS="*.* src supabase"
SHELLCHECK_GLOBS="scripts/*"

exit=0

case $1 in
  --fix)
    if [ -n "$2" ]; then
      shift
      ESLINT_GLOBS="$*"
      PRETTIER_GLOBS="$*"
    fi
    eslint --fix $ESLINT_GLOBS || exit=$?
    prettier --write $PRETTIER_GLOBS || exit=$?
    exit $exit
    ;;
  "")
    eslint $ESLINT_GLOBS
    prettier --check $PRETTIER_GLOBS
    shellcheck $SHELLCHECK_GLOBS
    ;;
  *)
    ESLINT_GLOBS="$*"
    PRETTIER_GLOBS="$*"
    eslint $ESLINT_GLOBS || exit $?
    prettier $PRETTIER_GLOBS
    ;;
esac
