
/**
 * Module dependencies.
 */

var express = require('express'),
    fs      = require('fs'),
    sys     = require('sys'),
    path    = require('path');

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

ws_server.on('connection', function(client) {
  // there, client should be stored depending on what files they are
  // watching
  client.on('message', function(msg) {
	console.log('got message %s from client %s', msg, client.sessionId);
  })
  client.on('disconnect', function() {
	// there client should be removed from the list of client watching
	// a given file
  });

  // say hello
  client.send('hello you');
});


// Only listen on $ node app.js

if (!module.parent) {
  app.listen(3000);
  console.log("Express server listening on port %d", app.address().port)
}
