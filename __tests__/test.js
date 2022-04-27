jest.setTimeout(15000)

const startServer = require('../index');

test('serverStartsAndStops', async () => {
  const mysqld = startServer();

  await mysqld.ready
  await mysqld.stop();
})
