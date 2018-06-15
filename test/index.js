if(!('PORT' in process.env) || process.env.PORT.match(/^\d+$/) === null)
  throw new Error('PORT_ENV_VAR_REQUIRED')

var DEBUG = true;

var port = parseInt(process.env.PORT, 10);

var startServer = require('../');

exports.serverStartsAndStops = function(test) {
  test.expect(2);

  var mysqld = startServer({ port: port }, {reinitialize: false});

  DEBUG && mysqld.stdout.on('data', function (data) {
    console.log('stdout: ', data.toString());
  })

  mysqld.stderr.on('data', function (data) {
    DEBUG && console.log('stderr: ', data.toString());

    var ready =
      !!data.toString().match(/Server socket created on IP: '::'/);

    if(ready) {
      test.equal(ready, true);
      mysqld.stop();
    }
  });

  mysqld.on('exit', function (code) {
    test.equal(code, 0);
    test.done();
  });
}
