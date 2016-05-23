/**
 * this module exports a function which parses the process.argv
 * and returns an object
 */

var path = require('path');

exports.printUsage = function printUsage() {
	console.log("A command line tool that spawns a webserver allowing to look for");
	console.log("log files and watch them in real time as they evolve");
	console.log("");
	console.log("USAGE");
	console.log("node app.js [<file> [as <alias>]] [<port>]");
	console.log("");
	console.log("<file> is a log file that should be available for online watching.");
	console.log("you can optionnaly define an alias for this file.");
	console.log("multiple <file>s can be specified. ");
	console.log("");
	console.log("<port> is the port on which the webserver+websocket server will listen.");
	console.log("by default 3000");
	console.log("EXAMPLE:");
	console.log("node app.js /var/log/apache2/access.log as access \\");
	console.log("            /var/log/apache2/error.log as error 3000");
}

// I had fun a little with this =) it works as a real parser (as the one 
// JS in codemirror). there is a queue of functions parsing the flow of
// args. they can either deflect the arg (say that they're not the one 
// supposed to read this) or treat it and add other functions to the 
// queue
exports.parseArgs = function parseArgs() {
	var args = process.argv.splice(2);
	if(args.length == 0) throw new SyntaxError('No arguments to parse!');
	var res = {
		files: {
		}
	};
	var queue = [];


	function readFiles (arg) {
		if(!arg) return;
        if(! /^\d+$/.test(arg)) {
			queue.unshift(readFiles);
			queue.unshift(readFileName);
		}
		return arg;
	}

	function readFileName(arg) {
		// if it doesn't look like a filename
		if(! /[-a-zA-Z0-1\/._]+/.test(arg)) {
			// this is not meant for us
			console.log('readFileName :: rejecting %s', arg);
			return arg
		}
		queue.unshift(readAlias(arg));
	}

	function readAlias(filename) {
		// we return a closured function
		return function do_read_as(arg) {
			if(arg !== 'as') {
				// if this isn't the keyword 'as'
				// then there may not be an alias after all

				// so we store the filename and signify that this arg
				// is not for us
				res.files[filename] = filename;
				return arg;
			}
			// otherwise, the next arg is the alias
			queue.unshift(function do_readAlias(alias) {
				// here we read the actual alias
				// the alias should be a rather simple text
				// if there is no alias (ex: 'as' as the last argument)
				filename = path.resolve(process.cwd(), filename)
				if(!alias) res.files[filename] = filename;
				// otherwise we've got it
				else res.files[alias] = filename;
			});
		}
	}

	function readPort(arg) {
        if(! /^\d+$/.test(arg)) return arg;
		var port = parseInt(arg);
		if(!isNaN(port)) { 
			res.port = parseInt(arg);
		}
		else {
			return arg;
		}
	}

	function readHelp(arg) {
		if(arg === '--help' || arg === '-h') {
			res.help = true;
		}
		else return arg;
	}

	function ignore(arg) {
		if(arg === null) return;
		queue.unshift(ignore);
	}

	queue.push(readHelp);
	queue.push(readPort);
	queue.push(readFiles);
	queue.push(readPort);
	queue.push(ignore);
	while(args.length) {
		var f = queue.shift();
		var arg = args.shift();
        //console.log('parsing %s using %s', arg, f.name);
		var r = f(arg);
		if(r) args.unshift(arg);
	}
	// flush the queue
	while(queue.length) {
		var f = queue.shift()
		//console.log('flushing %s from the queue',f.name);
		f(null);
	}
	if(args.length) {
		console.log('There are some args left to parse')
		console.log(args);
	}

	// at this point, we have to check the files
	check_arguments(res);
	return res;
}

function check_arguments(res) {
	// check if the file is a directory, if so, add its files
	// to the list of files to watch
	var fs = require('fs');
	function check_is_directory(filename) {
		var stat = fs.statSync(filename);
		return stat.isDirectory(filename)
	}

	function dir_add_subfiles (alias, filename) {
		var list = fs.readdirSync(filename);
		for (var i = 0; i < list.length; ++i) {
			try {
				var stat = fs.statSync(filename + '/' + list[i]);
			}
			catch(e) {
				// something went wrong... whatever
				console.log('not watching %s', alias+'/'+list[i]);
				continue;
			}
			// we could check if this is a FILE, but too restrictive
			// in my opinion
			// BUT, we dont watch subdirectories
			if(stat.isDirectory()) return;
			// we add this to the list with the key
			// alias/name
			res.files[alias+'/'+list[i]] = filename+'/'+list[i];
		}
	}

	for(var key in res.files) {
		try {
			if(check_is_directory(res.files[key])) {
				// walk the directory and add subfiles
				dir_add_subfiles(key, res.files[key]);
			}
			// else, not a directory, but still exists
		}
		catch(e) {
			console.log('not watching "%s": %s', key, e.message)
			delete res.files[key];
		}
	}

	// time to check if we have the rights... but in another commit !
}
