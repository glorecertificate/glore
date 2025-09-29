#!/usr/bin/env sh
# shellcheck disable=SC2086

[ -z $CI ] && CI=true

ESLINT_CMD=
ESLINT_GLOBS=
ESLINT_ARGS=
PRETTIER_CMD=--check
PRETTIER_GLOBS=
PRETTIER_ARGS=

exit=0

for arg in "$@"; do
  case $arg in
    --fix)
      ESLINT_CMD=--fix
      PRETTIER_CMD=--write
      ;;
    *)
      ESLINT_GLOBS="$ESLINT_GLOBS $arg"
      PRETTIER_GLOBS="$PRETTIER_GLOBS $arg"
      ;;
  esac
done

[ -z "$ESLINT_GLOBS" ] && ESLINT_GLOBS=.
[ -z "$PRETTIER_GLOBS" ] && PRETTIER_GLOBS=.

CI=$CI eslint $ESLINT_CMD $ESLINT_GLOBS $ESLINT_ARGS || exit=$?
CI=$CI prettier $PRETTIER_CMD $PRETTIER_GLOBS $PRETTIER_ARGS || exit=$?
exit $exit
