var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var extend = require('extend');

var defaultConfig = {
  port                    : 3306,
  // Binary log settings
  server_id               : 1,
  binlog_format           : 'row',
  log_bin                 : '../../binlog/mysql-bin.log',
  binlog_checksum         : 'CRC32',
  expire_logs_days        : 10,
  max_binlog_size         : '100M',
  // Settings related to this package's directory structure
  // tmpdir set in server/start.sh
  basedir                 : './',
  datadir                 : './data/mysql',
  socket                  : './mysql.sock',
  // Other settings
  innodb_buffer_pool_size : '128M',
  expire_logs_days        : '10',
  sql_mode                : 'NO_ENGINE_SUBSTITUTION,STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_AUTO_CREATE_USER',
}

// Start the MySQL server, optionally specifying options for my.cnf
module.exports = function(config, opts) {
  opts = opts || {}
  const {
    // reinitialize the database upon startup
    reinitialize
  } = opts

  var fullConfig = extend(defaultConfig, config || {});

  // Generate my.cnf from provided configuration
  var myCnf = '[mysqld]\n' +
    Object.keys(fullConfig).map(function(key) {
      if(fullConfig[key] === null || fullConfig[key] === undefined) {
        return ''
      } else {
        return key + ' = ' + fullConfig[key]
      }
    }).join('\n');

  fs.writeFileSync(path.join(__dirname, 'server/my.cnf'), myCnf);

  // crude method of ensuring there is no mysqld process already running
  exec('killall mysqld')

  // Did not work spawning mysqld directly from node, therefore shell script
  var child = spawn(path.join(__dirname, reinitialize ? 'server/reinitialize.sh' : 'server/start.sh'));

  child.stop = function() {
    exec('killall mysqld')
  };

  return child
}

// Provide package directory for external use
module.exports.pkgdir = function() {
  return __dirname
}
