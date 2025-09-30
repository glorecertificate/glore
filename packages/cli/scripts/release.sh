#!/usr/bin/env sh

. "$(dirname "$0")"/../init.sh

CHANGELOG=CHANGELOG.md

cd_root

case $1 in
  format)
    [ -n "$(git status --porcelain $CHANGELOG)" ] && git add $CHANGELOG
    ;;
  validate)
    [ -z "$(git log "@{u}..")" ] || [ "$SKIP_CI" = 0 ] && exit 0
    pnpm run build
    pnpm run check
    ;;  
esac
