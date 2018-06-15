#!/usr/bin/env bash

rm -rf ./data/mysql/*
./mysqld --initialize-insecure --explicit_defaults_for_timestamp --user=mysql --datadir=./data/mysql
