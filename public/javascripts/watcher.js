window.watcher = {};
(function(watcher) {

/**
 * Open a websocket to the server
 */
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
        td.rawLine = line;
        tr.appendChild(td);
        table.appendChild(tr);
        overflow.onnewline();
        if($(table).hasClass('filtered')) {
            table.dofilter();
        }
    });
    // setup scrolling
    var manualScroll = false;
    overflow.onnewline = function() {
        if(!manualScroll) this.scrollTop = this.scrollHeight;
    }
    $(overflow).scroll(function() {
        manualScroll = ((this.offsetHeight + this.scrollTop) < this.scrollHeight);
    })
}

watcher.setupSingleLog = function setupSingleLog (filename) {
    var table = $(".log.file-watcher")[0];
    watcher.setupLog(table, filename);
    watcher.setFilter(table, document.getElementById('filters'));
}

function logIterator(table) {
    var row = table.firstChild;
    return function next() {
        if(!row) return;
        var res = row.firstChild;
        row = row.nextSibling;
        return res;
    }
    $(noline).addClass('hidden');
}

watcher.filter = function filter(table, fun) {
    $(noline).addClass('hidden');
    $(table).addClass('filtered');
    var noline = table.nextSibling;

    var row,
        nb = 0,
        next = logIterator(table);
    while(row = next()) {
        var new_line = fun(row.rawLine);
        if(new_line) {
            $(row).addClass('match');
            row.innerHTML = new_line.toString();
            ++nb;
        } else {
            $(row).removeClass('match');
        }
    }
    if(!nb) {
        $(noline).removeClass('hidden');
    }
}
watcher.raw = function raw(table) {
    $(table).removeClass('filtered');

    var row,
        next = logIterator(table);
    while(row = next()) {
        row.innerHTML = row.rawLine;
    }
}

watcher.setFilter = function setFilter(table, form) {
    var filter = $(form).children('input[type=text]')[0];
    var regex = $(form).children('input[type=checkbox]')[0];
    var error = $(form).children('.error')[0];
    function dofilter() {
        error.innerHTML = "";
        try {
            if(filter.value === '') return watcher.raw(table);
            var match = regex.checked ? readRegExp(filter.value) :
                                        new RegExp(filter.value, 'gi');
            var nb = watcher.filter(table, function(str) {
                if(match(str)) {
                    return str.replace(match, "<strong>$&</strong>");
                }
            })
        } catch(e) {
            error.innerHTML = e.message;
        }
    }
    table.dofilter = dofilter;
    $(filter).blur(dofilter).keyup(dofilter).change(dofilter);
    $(regex).change(dofilter);
}

function readRegExp (str) {
    var correct = str[0] === '/';
    correct = correct && (str[1] !== '*');
    correct = correct && (str.indexOf('\n') === -1);
    correct = correct && (str.indexOf('\r') === -1);
    if(!correct) {
        throw new TypeError("string doesn't look like a RegExp");
    }
    var sandbox = {window:null, document:null, '$':null, jQuery:null};
    var res;
    with(sandbox) {
        res = eval("("+str+")");
    }
    correct = correct && (res instanceof RegExp);
    if(!correct) {
        throw new TypeError("not a regular expression");
    }
    return res;
}

})(window.watcher);
