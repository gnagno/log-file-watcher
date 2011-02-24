var fs      = require('fs'),
    path    = require('path'),
    express = require('express'),
    app     = require('express').createServer(),
    sys     = require('sys'),
    qs      = require("querystring"),
    http    = require('http'),
    url     = require('url'),
    server;
    
server = http.createServer(function(req, res){
  var path = url.parse(req.url).pathname;
  switch (path){
    case '/poll':
      par = require('url').parse(req.url, true);
      file = par['query']['file'];
            
      fs.watchFile(file, function(curr, prev) {
        fs.createReadStream(file, { start: prev.size, end: curr.size}).addListener("data", function(lines) {
          res.writeHead(200, {'Content-Type': path == 'json.js' ? 'text/javascript' : 'text/html'})
          res.write(lines.toString() + "<br />", 'utf8');
          res.end();
        });
      });
    break;
  
    case '/json.js':
    case '/jquery-1.5.min.js':
    case '/jquery_url_parser.js':
    case '/index.html':
      fs.readFile(__dirname + path, function(err, data){
        if (err) return send404(res);
        res.writeHead(200, {'Content-Type': path == 'json.js' ? 'text/javascript' : 'text/html'})
        res.write(data, 'utf8');
        res.end();
      });
    break;
  }
});

server.listen(8080);
sys.puts("Server listening on port 8080");
