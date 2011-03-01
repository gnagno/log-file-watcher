var sys = require('sys');

exports.clients = {
// - 
  
  clients: {},
  files: {},
   /** this will add the client if it is not already present and connect a
	* file to it, if the client is already present it will just add a file
	* to the list of files the client is watching
	*/
  addClient: function(client, file) {  
    if( client in this.clients ) {
      this.clients[client].push(file);
    } else {
      this.clients[client] = new Array(file);
    }
    
    if(file in this.files) {
      this.files[file].push(client);
    } else {
      this.files[file] = new Array(client);
    }
  },
  /** this removes the connection between a client and a file, and
   * eventually remove the listener if nobody is watching that file
   */
  removeClient: function(client, file) {
    if( client in this.files[file] ){
      // delete files[file][client];      
      this.removeByElement(files[file], client);
    }
    
    if( file in this.clients[client]) {
      // delete clients[client][file]
      this.removeByElement(clients[client], file);
    }
  },
  // this removes one client from the list, and eventually removes the listeners for files nobody is watching anymore 
  removeClient: function(client) {
    
  },
  /** given a filename returns the list of all clients that are watching 
  * that file to broadcast the message to them
  */
  getClients: function(file) {
    return this.files[file];
  },
  removeByElement: function(array, element){
    for(var i=0; i < array.length; i++ ){ 
      if(array[i]==element)
        array.splice(i,1); 
    } 
  }
};
