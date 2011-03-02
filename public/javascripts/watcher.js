function longpoll(filename){
  $.ajax({
    url: "poll/" + filename,
    success: function(data){
      $("#log").append(data);
      longpoll(filename);
    }
  });
};
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
  console.log('new line in %s: %s', message.file, message.line);
});
socket.on('disconnect', function() {
  console.log('disconnected');
});
