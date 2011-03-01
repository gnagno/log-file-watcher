var clients = require('../lib/clients').clients;
var assert = require('assert');
var sys = require('sys');


// test adding the first client
clients.addClient('client1' , 'file1');
assert.equal( clients.getClients('file1').length, 1, 'The count of clients for file1 should be 1' );
assert.equal( clients.getClients('file1')[0], 'client1' );

// test adding the second client
clients.addClient('client2' , 'file1');
assert.equal( clients.getClients('file1').length, 2, 'The count of clients for file1 should be 2' );
assert.equal( clients.getClients('file1')[0], 'client1' );
assert.equal( clients.getClients('file1')[1], 'client2' );

// test removing one client
clients.removeClient('client2' , 'file1');
assert.equal( clients.getClients('file1').length, 1, 'The count of clients for file1 should be 1' );
assert.equal( clients.getClients('file1')[0], 'client1' );

