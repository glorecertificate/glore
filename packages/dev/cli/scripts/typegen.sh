#!/usr/bin/env sh

sh "$(dirname "$0")/db.sh" typegen && next typegen
