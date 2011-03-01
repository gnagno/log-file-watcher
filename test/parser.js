var parser = require('../lib/parseArgs');
console.log(process.argv);
console.log('commencing parsing');
try {
	var res = parser.parseArgs()
}
catch(e) {
	console.log(e.message);
	process.exit(1);
}
console.log(res);
