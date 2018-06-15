# MySQL Server 5.7 for Mac OSX x86 64-bit

This is a fork of [mysql-server-5.6-osx-x64](https://github.com/numtel/mysql-server-5.6-osx-x64).

___

Install and run [MySQL server](http://www.mysql.com) under the current user inside of the application directory.

```
npm install mysql-server-5.7-osx-x64
```

Provides function for spawning MySQL server instance with optional configuration settings. Returns [`ChildProcess`](https://nodejs.org/api/child_process.html#child_process_class_childprocess).

* Only one instance may be spawned per application.
* `stop()` method added to returned `ChildProcess` instance to stop the server.

```javascript
var startMysql = require('mysql-server-5.6-osx-x64');

var mysqld = startMysql({ port: 3307 }, {reinitialize: false});

mysqld.stdout.on('data', function (data) {
  console.log('stdout: ' + data);
});

mysqld.stderr.on('data', function (data) {
  console.log('stderr: ' + data);
});

mysqld.on('close', function (code) {
  console.log('child process exited with code ' + code);
});

// Later on, stop server...
mysqld.stop();

```

See [`index.js`](index.js) for the default configuration options. Pass `undefined` or `null` for a given configuration key to skip including it even if it is specified in the defaults.

## License

GPLv2
