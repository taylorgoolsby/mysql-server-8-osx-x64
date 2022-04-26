jest.setTimeout(15000)

const startServer = require('../index');

test('serverStartsAndStops', async () => {
  const mysqld = startServer();

  await mysqld.ready
  mysqld.stop();

  return new Promise(resolve => {
    mysqld.on('exit', function (code) {
      expect(code).toBe(0)
      resolve()
    });
  })
})
