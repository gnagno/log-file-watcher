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
	console.log('watching', parameters.files);
}
catch(e) {
	if(e instanceof SyntaxError) {
		console.log('could not parse arguments: %s', e.message);
		arguments.printUsage();
		process.exit(1);
	}
	console.log(e.message)
	process.exit(2);
}
/**
 * parameters is on object of this form
 * {
 *   port: <int:optional>
 *   files: {
 *	   <alias>: <path>
 *   }
 * }
 *
 * if no alias for a file is specified, then alias = path
 */

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.logger({format: ":method :url :date from :remote-addr :user-agent -> :status"}));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
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
    // it's easier to pass an array of aliases than giving out
    // the actual parameters.files object
    var array = [];
    for(var f in parameters.files)
        array.push(f);
	res.render('landing', {
		//layout: false,
		locals: {
            title: "Welcome to the log watcher",
			// i would like a list of files we're able to watch
			files: array
		}
	})
});
// this route doesn't allow us to watch absolute paths filename
// because of the slashes. we should do it we a regex, but would
// need a bit of express doc reading
//
// so for now it only works with aliases =)
app.get('/:filename', function(req, res, next) {
  watched = req.params.filename
  res.render('file', {
    locals: {
      title: 'Log file watcher',
      watched: watched 
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
  client.watchers = []; ///< a list of file watchers
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
    // we destroy every watcher that we built
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
