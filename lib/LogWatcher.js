var util = require('util');
var EventEmitter = require('events').EventEmitter;
var path = require('path');
var child_process = require('child_process');

/**
 * A LogWatcher object watches for changes mage to a log files
 * (typically, lines are being appended). It emits a 'line' events
 * when it detects that a new line has been added to the log file
 *
 * under the hood it uses a child process `tail -F` for simplicity
 * although it never starts two processes on the same file
 *
 * @constructor
 * @param filename the path to the file to watch. absolute or relative
 */
function LogWatcher (filename) {
	// get the absolute path 
	filename = path.resolve(process.cwd(), filename);
	// check if this file is not being watched already
	if(LogWatcher.watched[filename]) {
		// if we already watch this, we just return the active watcher
		LogWatcher.watched[filename]._nbclients++;
		return LogWatcher.watched[filename];
		// we don't actually build a new watcher, but who cares ?
	}
	EventEmitter.apply(this);
	this.filename = filename;
	this._nbclients = 1;

	// run the subprocess
	// what we want is to get the streamed output out of
	// tail -F <filename>
	this.tail = child_process.spawn('tail', ['-F', this.filename]);
	this.tail.stdout.setEncoding('utf8');
	var lines = require('lines');
	lines(this.tail.stdout); // tiny utility I made to stream lines
	
	// attach listener on new lines
	var log_watcher = this;
	this.tail.stdout.on('line', function(line) {
		log_watcher.emit('line', line);
	});
	this.tail.once('exit', function(code, signal) {
		if(log_watcher.killing) return;
		log_watcher.emit('error', new Error("tail subprocess ended badly"));
		log_watcher.emit('end');
	});
	this.on('end', function() {
		// remove ourself from the list of active watchers
		LogWatcher.watched[log_watcher.filename] = null;
	});

	// adding ourselves to the list of watchers
	LogWatcher.watched[this.filename] = this;
}
util.inherits(LogWatcher, EventEmitter);

LogWatcher.prototype.close = function close() {
	// note that one of our clients doesn't want to watch anymore
	this._nbclients--;
	// if this was not our last client, then do nothing
	if(this._nbclients > 0) return;

    // kill the subprocess
	this.killing = true;
	this.tail.kill();
	// emit 'end' event
	this.emit('end');
};

// this is a hash of full paths of files that are being watched
LogWatcher.watched = {};

module.exports = LogWatcher;
