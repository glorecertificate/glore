#!/usr/bin/env sh

CHANGELOG=CHANGELOG.md

cmd=$1

case $cmd in
  format)
    ./node_modules/.bin/prettier --write $CHANGELOG

    if [ -n "$(git status --porcelain $CHANGELOG)" ]; then
      git add $CHANGELOG
    fi
    ;;
  validate)
    if [ -z "$(git log "@{u}..")" ] || [ "$SKIP_CI" = 0 ]; then
      exit 0
    fi
    
    pnpm run build && pnpm run check
    ;;  
esac

