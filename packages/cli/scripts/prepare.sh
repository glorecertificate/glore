#!/usr/bin/env sh

. "$(dirname "$0")"/../init.sh

cd_app
$CLI db prepare
next typegen
