const fs = require('fs');
const path = require('path');
const spawn = require('child_process').spawn;
const mysql = require('mysql2')
const cosmiconfig = require('cosmiconfig')

const explorer = cosmiconfig("mysql-server")
const rcResults = (explorer.searchSync() || {}).config || {}
const defaultConfigrc = {
  allowBlockedPort: false,
  port: 3306,
  reinitialize: false,
  verbose: false,
  mycnf: {}
}
const configrc = {
  ...defaultConfigrc,
  ...rcResults
}

const defaultConfig = {
  default_time_zone: '+00:00',
  port                    : 3306,
  // Binary log settings
  server_id               : 1,
  binlog_format           : 'row',
  log_bin                 : '../../binlog/mysql-bin.log', // relative to datadir
  binlog_checksum         : 'CRC32',
  expire_logs_days        : 10,
  max_binlog_size         : '100M',
  // Settings related to this package's directory structure
  // tmpdir set in server/start.sh
  basedir                 : './',
  datadir                 : path.resolve(__dirname, 'server/data/mysql'),
  // Other settings
  innodb_buffer_pool_size : '128M',
  sql_mode                : 'NO_ENGINE_SUBSTITUTION,STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO',
  lower_case_table_names  : 2
}

let alreadyRunning = false

/*
Returns the child thread running mysqld.
I'm calling the return value "mysqld":
Use mysqld.stop() to stop server.
mysqld.ready is a Promise.
mysqld.ready resolves when the server is fully loaded.
mysqld.ready rejects when the port is blocked unless allowBlockedPort=true.
*/
const startServer = function() {
  const locked = fs.existsSync(path.join(__dirname, 'server/data/mysql/ibdata1'))
  if (alreadyRunning || locked) {
    console.log('A previous instance of mysql-server is still running.')
    return
  }

  const {
    allowBlockedPort,
    mycnf,
    port,
    reinitialize,
    verbose,
  } = configrc

  const fullConfig = {
    ...defaultConfig,
    ...mycnf,
    port: port,
  }

  // Generate my.cnf from provided configuration
  const myCnfFile = '[mysqld]\n' +
    Object.keys(fullConfig).map(function(key) {
      if(fullConfig[key] === null || fullConfig[key] === undefined) {
        return ''
      } else {
        return key + ' = ' + fullConfig[key]
      }
    }).join('\n');

  fs.writeFileSync(path.join(__dirname, 'server/my.cnf'), myCnfFile);

  // crude method of ensuring there is no mysqld process already running
  // exec('killall -KILL mysqld')

  const initialized = fs.existsSync(path.resolve(__dirname, 'server/data/mysql/mysql'))

  // Did not work spawning mysqld directly from node, therefore shell script
  alreadyRunning = true
  const mysqld = spawn(path.join(__dirname,
    !initialized || reinitialize ? 'server/reinitialize.sh' : 'server/start.sh'), {detached: true});
  mysqld.on('close', function (code) {
    alreadyRunning = false
  })

  if (verbose) {
    mysqld.stdout.pipe(process.stdout)
    mysqld.stderr.pipe(process.stdout)
  }

  let doNotShutdown = false

  mysqld.stop = async function() {
    if (!alreadyRunning) {
      console.log('MySQL server is not running. Already stopped.')
      return
    }

    const p = new Promise(async (resolve) => {
      mysqld.on('close', () => {
        console.log('close')
        resolve()
      })
      kill(mysqld.pid)
    })

    return p
  };

  mysqld.ready = new Promise((resolve, reject) => {
    let promiseDone = false
    mysqld.stderr.on('data', function(data) {
      console.log('[mysql]', data.toString())
      const ready =
        !!data.toString().match(/MySQL Community Server/);
      const blockedPort = !!data.toString().match(/Do you already have another mysqld server running on port:/) || !!data.toString().match(/Unable to lock/)
      const badPreviousShutdown = !!data.toString().match(/Check that you do not already have another mysqld process using the same InnoDB data or log files./)

      if (!promiseDone && badPreviousShutdown) {
        promiseDone = true
        doNotShutdown = true
        kill(mysqld.pid)
        console.log('A previous instance of mysql-server is still running. The current mysql-server is reusing this instance.')
        return resolve()
      }

      if (!promiseDone && ready) {
        promiseDone = true
        console.log(`mysql-server running on port ${port}.`)

        // https://stackoverflow.com/a/56509065:
        const connection = mysql.createConnection({
          host     : 'localhost',
          user     : 'root',
          password : '',
          port: configrc.port
        });
        connection.on('error', err => {
          // eat error
        })
        connection.query(`ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';`, (err, results, fields) => {
          if (err) {
            console.log('err', err)
          }
          console.log('Do not use this in production: Downgraded "MySQL" to authenticate using "mysql_native_password".')
          return resolve()
        })

        return
        // return resolve()
      }
      if (!promiseDone && blockedPort) {
        promiseDone = true
        if (allowBlockedPort) {
          doNotShutdown = true
          console.log(`mysql-server is not running. Port ${port} is in use by a different program. But allowBlockedPort=true. This external instance is being used.`)
          kill(mysqld.pid)
          return resolve()
        } else {
          return reject(new Error(`Port ${fullConfig.port} is blocked. New MySQL server not started.`))
        }
      }
    })
  })

  return mysqld
}

function kill(pid) {
  process.kill(-pid)
}

module.exports = startServer