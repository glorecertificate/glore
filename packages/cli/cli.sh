#!/usr/bin/env sh
# shellcheck disable=SC2254

. "$(dirname "$0")/init.sh"

command=$1
commands=$(find "$(dirname "$0")/scripts" -name "*.sh" -exec basename {} .sh \; | sort)
is_valid=false

for cmd in $commands; do
  if [ "$cmd" = "$command" ]; then
    is_valid=true
    break
  fi
done

if [ $is_valid = false ]; then
  case $command in
    ""|help|-h|--help)
      ;;
    *)
      print_error "Unknown command '$command'"
      echo
      ;;
  esac

  echo "Usage:"
  printf "  %s <command> [args...]\n\n" "$CLI"
  echo "Available commands:"
  for cmd in $commands; do
    echo "  $cmd"
  done
  echo "  help, -h, --help"

  exit 1
fi

shift
sh "$(realpath "$(dirname "$0")")/scripts/$command.sh" "$@"
