//requiring libraries
const express = require('express');
const app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

//static hosting using express
app.use(express.static('public'));



//signaling handlers
io.on('connection', function (socket) {
  console.log('a user connected');

  //when client emits create or join
  socket.on('create or join', function (room){
    console.log('create or join to room', room);

    //count number of users on room
    var myRoom = io.sockets.adapter.rooms[room] || { length: 0 };
    var numClients = myRoom.length;
    console.log(room, 'has', numClients,' clients');

    if (numClients == 0) { //no users on the room
      socket.join(room);
      socket.emit('created', room);
    } else if (numClients >= 1) { //one user on the room
      socket.join(room);
      socket.emit('joined', room);
    } else {  //room is full
      socket.emit('full', room);
    }
  });

  //relay only handlers
  socket.on('ready', function (room){
    socket.broadcast.to(room).emit('ready');
    console.log('ready');
  });

  socket.on('candidate', function (event){

    socket.broadcast.to(event.room).emit('candidate',event);

  });

  socket.on('offer', function(event){
    socket.broadcast.to(event.room).emit('offer',event.sdp);
     console.log('offer');
  });

  socket.on('answer', function(event){
    socket.broadcast.to(event.room).emit('answer',event.sdp);
     console.log('anwser');
  });
  // Listen for chat messages from clients
  socket.on('chat message', function (message) {
    io.to(room).emit('chat message', message);
  });
});

//listener
http.listen(3000,function() {
  console.log('listening on *:3000');
});
