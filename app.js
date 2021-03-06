#!/usr/bin/env node

/**
 * A command line tool that spawns a webserver allowing to look for
 * log files and watch them in real time as they evolve
 *
 * Command syntax
 * node app.js [<file> [as <alias>]] [<port>]
 *
 * <file> is a log file that should be available for online watching.
 * you can optionnaly define an alias for this file.
 * multiple <file>s can be specified. 
 *
 * <port> is the port on which the webserver+websocket server will listen.
 * by default 3000
 * EXAMPLE:
 * node app.js /var/log/apache2/access.log as access \
 *				/var/log/apache2/error.log as error 3000
 */


/**
 * Module dependencies.
 */

var express = require('express'),
    fs      = require('fs'),
    sys     = require('sys'),
    path    = require('path');

// parse arguments
var arguments = require('./lib/arguments');

var parameters;
try {
	parameters = arguments.parseArgs();
	if(parameters.help) {
		arguments.printUsage();
		process.exit(0);
	}
}
catch(e) {
	console.log('could not parse arguments: %s', e.message);
	arguments.printUsage();
	process.exit(1);
}
console.log('watching %s', sys.inspect(parameters.files));

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.logger({format: ":method :url :date from :remote-addr :user-agent -> :status\n"}));
  app.use(express.bodyDecoder());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.staticProvider(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

// default route for root page. without it, you get an error.
app.get('/', function(req, res, next) {
	res.render('landing', {
		layout: false,
		locals: {
			// i would like a list of files we're able to watch
		}
	})
});
// this route doesn't allow us to watch absolute paths filename
// because of the slashes. we should do it we a regex, but would
// need a bit of express doc reading
//
// so for now it only works with aliases =)
app.get('/:filename', function(req, res, next){
  filename = req.params.filename
  res.render('index', {
    locals: {
      title: 'Log file watcher',
      filename: filename 
	}
  });
});

app.get('/poll/:filename', function(req, res){
  filename = req.params.filename

  fs.watchFile(filename, function(curr, prev) {
    fs.createReadStream(filename, { start: prev.size, end: curr.size}).addListener("data", function(lines) {
      res.writeHead(200, {'Content-Type': path == 'json.js' ? 'text/javascript' : 'text/html'})
      res.write(lines.toString() + "<br />", 'utf8');
      res.end();
    });
  });
});



// set up socket.io
var io = require('socket.io');
var ws_server = io.listen(app, {
	resource: 'watch',
	flashPolicyServer: false,
	transports: [
		'websocket',
		'htmlfile',
		'xhr-multipart',
		'xhr-polling'
	]
});
var LogWatcher = require('./lib/LogWatcher');
ws_server.on('connection', function(client) {
  // there, client should be stored depending on what files they are
  // watching
  client.watchers = [];
  client.on('message', function(msg) {
	console.log('got message %s from client %s', msg, client.sessionId);

	// if this doesn't seem to be a file to start watching, leave
	if(typeof msg !== 'string' || !(msg in parameters.files)) return

	var watcher = new LogWatcher(parameters.files[msg]);
	watcher.on('line', function(line) {
	  client.send({file: msg, line: line});
	});
	client.watchers.push(watcher);
  })
  client.on('disconnect', function() {
	// there client should be removed from the list of client watching
	// a given file
	
	while(client.watchers.length) {
	  client.watchers.pop().close();
	}
  });

  // say hello
  client.send('hello you');
});


// Only listen on $ node app.js

if (!module.parent) {
  app.listen(parameters.port || 3000);
  console.log("Express server listening on port %d", app.address().port)
}
