#! /usr/bin/env node
const startServer = require('./index')

const mysqld = startServer(null, {reinitialize: false})

mysqld.stdout.pipe(process.stdout)
mysqld.stderr.pipe(process.stderr)

process.on('SIGINT', () => {
  mysqld.stop()
  mysqld.on('exit', function (code) {
    process.exit(0)
  });
})