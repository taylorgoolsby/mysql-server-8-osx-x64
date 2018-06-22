#!/usr/bin/env bash

cd ${0%/*}
./mysqld --defaults-file=my.cnf --tmpdir=$(mktemp -d -t mysql) --explicit_defaults_for_timestamp
