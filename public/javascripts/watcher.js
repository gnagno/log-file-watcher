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
  this.send('hello');
});
socket.on('message', function(message) {
  console.log("got message %s", message);
});
socket.on('disconnect', function() {
  console.log('disconnected');
});
