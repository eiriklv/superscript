// Run this and then telnet to localhost:2000 and chat with the bot

var net             = require("net");
var superscript     = require("superscript");
var debug           = require("debug")("telnetserver");

var options = {};
var sockets = [];

var botHandle = function(err, bot) {
    
  var receiveData = function(socket, bot, data) {

    // Handle incoming messages.
    debug("Message", data.toString('hex',0,data.length));
    var message = "" + data;

    message = message.replace(/[\x0D\x0A]/g, "");

    if (message.indexOf("/quit") == 0 || data.toString('hex',0,data.length) === "fff4fffd06") {
      socket.end("Good-bye!\n");
      return;
    }

    bot.reply(socket.name, message.trim(), function(err, reply){

      // Find the right socket
      var i = sockets.indexOf(socket);
      var soc = sockets[i];

      soc.write("\nBot> " + reply + "\n");
      soc.write("You> ");

    });
  }

  var closeSocket = function(socket, bot) {
    var i = sockets.indexOf(socket);
    var soc = sockets[i];

    bot.userDisconnect(soc.name);
    console.log("User '" + soc.name + "' has disconnected.\n");

    if (i != -1) {
      sockets.splice(i, 1);
    }
  }

  var newSocket = function (socket) {
    socket.name = socket.remoteAddress + ":" + socket.remotePort;
    console.log("User '" + socket.name + "' has connected.\n");

    sockets.push(socket);
    
    // Send a welcome message.
    socket.write('Welcome to the Telnet server!\n');
    socket.write("Hello " + socket.name + "! " + "Type /quit to disconnect.\n\n");

    bot.userConnect(socket.name);

    // Send their prompt.
    socket.write("You> ");

    socket.on('data', function(data) {
      receiveData(socket, bot, data);
    });

    // Handle disconnects.
    socket.on('end', function() {
      closeSocket(socket, bot);
    });

  };

  // Start the TCP server.
  var server = net.createServer(newSocket);

  server.listen(2000);
  console.log("TCP server running on port 2000.\n");
}

// This assumes the topics have been compiled to data.json first
// See superscript/bin/parse for information on how to do that.

// Main entry point
new superscript('./data.json', options, function(err, botInstance){
  botHandle(null, botInstance);
});
