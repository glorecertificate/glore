#!/usr/bin/env sh
# shellcheck disable=SC2254

CLI=glore
COMMANDS_PATH="scripts"

command=$1
commands=$(find "$(dirname "$0")/$COMMANDS_PATH" -name "*.sh" -exec basename {} .sh \; | sort)
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
      printf '\033[0;31mUnknown command "%s"\033[0m\n\n' "$command"
      ;;
  esac
  echo "Usage:"
  printf "  %s <command> [args...]\n\n" $CLI
  echo "Available commands:"
  for cmd in $commands; do
    echo "  - $cmd"
  done
  echo "  - help, -h, --help"
  exit 1
fi

case $PWD in
  */apps/*|*/packages/*)
    case $command in
      release)
        printf "\033[0;31mThe %s command can only be run from the project root\033[0m\n" "$command"
        exit 1
        ;;
    esac
    ;;
esac

case $PWD in
  */apps/*)
    ;;
  *)
    case $command in
      build|db|dev)
        printf "\033[0;31mThe %s command must be run from an application directory\033[0m\n" "$command"
        exit 1
        ;;
    esac
    ;;
esac


shift
sh "$(dirname "$0")/$COMMANDS_PATH/$command.sh" "$@"
