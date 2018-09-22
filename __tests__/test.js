var DEBUG = process.env.DEBUG || false;

var port = parseInt(process.env.PORT || 3306, 10);

var startServer = require('../');

test('serverStartsAndStops', async () => {
  const mysqld = startServer({ port: port }, {reinitialize: false});
  DEBUG && mysqld.stderr.pipe(process.stdout)

  await mysqld.ready
  mysqld.stop();

  return new Promise(resolve => {
    mysqld.on('exit', function (code) {
      expect(code).toBe(0)
      resolve()
    });
  })
})
