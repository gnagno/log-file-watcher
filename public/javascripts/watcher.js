window.watcher = {};
(function(watcher) {
var host = window.document.location.hostname;
var socket = new io.Socket(host, {
	resource: 'watch',
	transports: [
		'websocket',
		'htmlfile',
		'xhr-multipart',
		'xhr-polling'
	]
});
socket.connect();
socket.on('connect', function() {
  console.log('connected');
  // we send the names or aliases of the files we'd like to watch
  // for now we look for the filename in the path of the page we're in
  var filename = document.location.pathname.substr(1);
  // the substring is to get rid of the leading slash
  this.send(filename);
});
socket.on('message', function(message) {
  console.log("got message %s", message);
});
socket.on('message', function(message) {
  if(typeof message !== 'object') return;
  socket.emit('file-'+message.file, [message.line || "&nbsp;"]);
  console.log('new line in %s: %s', message.file, message.line);
});
socket.on('disconnect', function() {
  console.log('disconnected');
});
watcher.socket = socket;

watcher.setupLog = function setupLog(table, filename) {
    var event = 'file-'+filename;
    var overflow = table.parentNode || table.parentElement;
    socket.on(event, function online(line) {
        var tr = document.createElement('tr');
        var td = document.createElement('td');
        td.innerHTML = line;
        tr.appendChild(td);
        table.appendChild(tr);
    });
}

watcher.setupSingleLog = function setupSingleLog (filename) {
    var table = $(".log.file-watcher")[0];
    watcher.setupLog(table, filename);
}
})(window.watcher);
