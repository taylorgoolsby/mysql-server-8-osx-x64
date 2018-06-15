#!/usr/bin/env bash

cd ${0%/*}
rm -rf ./data/mysql/*
./mysqld --initialize-insecure --explicit_defaults_for_timestamp --user=mysql --datadir=./data/mysql
./mysqld --defaults-file=my.cnf --tmpdir=$(mktemp -d -t mysql) --explicit_defaults_for_timestamp
