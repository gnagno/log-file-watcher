var LogWatcher = require('../lib/LogWatcher');

var lw = new LogWatcher('/tmp/pippo.log');
lw.on('line', function(line) {
	console.log('got a line from file %s', this.filename);
});

setTimeout(function() {
	console.log('closing')
	lw.close();
}, 30000);
