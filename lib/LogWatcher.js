var util = require('util');
var EventEmitter = require('events').EventEmitter;
var path = require('path');
var child_process = require('child_process');

/**
 * A LogWatcher object watches for changes mage to a log files
 * (typically, lines are being appended). It emits a 'line' events
 * when it detects that a new line has been added to the log file
 *
 * under the hood it uses a child process `tail -f` for simplicity
 *
 * @constructor
 * @param filename the path to the file to watch. absolute or relative
 */
function LogWatcher (filename) {
	EventEmitter.apply(this);
	// get the absolute path 
	this.filename = path.resolve(process.cwd(), filename);
	// run the subprocess
	// what we want is to get the streamed output out of
	// tail -f <filename>
	this.tail = child_process.spawn('tail', ['-f', this.filename]);
	this.tail.stdout.setEncoding('utf8');
	var lines = require('lines');
	lines(this.tail.stdout); // tiny utility I made to stream lines
	
	// attach listener on new lines
	var log_watcher = this;
	this.tail.stdout.on('line', function(line) {
		log_watcher.emit('line', line);
	});
	this.tail.once('exit', function(code, signal) {
		if(this.killing) return;
		log_watcher.emit('error', new Error("tail subprocess ended badly"));
		log_watcher.emit('end');
	});
}
util.inherits(LogWatcher, EventEmitter);

LogWatcher.prototype.close = function close() {
    // kill the subprocess
	this.killing = true;
	this.tail.kill();
	// emit 'end' event
	this.emit('end');
};

module.exports = LogWatcher;
