#!/usr/bin/env sh

export CLI=glore
export APP=elearning

ROOT="$(git rev-parse --show-toplevel)"

. "$ROOT"/.env 2>/dev/null

alias cd_root="cd $ROOT"
alias cd_app="cd $ROOT/apps/$APP"

print_error() {
  printf '\033[0;31mError: %s\033[0m\n' "$@"
}

exit_with_error() {
  print_error "$@"
  exit 1
}
