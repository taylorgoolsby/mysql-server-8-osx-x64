var DEBUG = process.env.DEBUG || true;

var port = parseInt(process.env.PORT || 3306, 10);

var startServer = require('../');

test('serverStartsAndStops', async () => {
  const mysqld = startServer({ port: port }, {reinitialize: false});
  DEBUG && mysqld.stdout.pipe(process.stdout)

  mysqld.stderr.on('data', function (data) {
    DEBUG && console.log(data.toString());

    var ready =
      !!data.toString().match(/MySQL Community Server/);

    if(ready) {
      mysqld.stop();
    }
  });

  return new Promise(resolve => {
    mysqld.on('exit', function (code) {
      expect(code).toBe(0)
      resolve()
    });
  })
})
