const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

var idNames = []
var names = new Set()

function setNameAndId (id, name) {
    if (names.has(name)) {
      return false
    }
    removeId(id);
    names.add(name);
    idNames.push([id, name])
    return true
}

function getId (name) {
    let id = false
    idNames.forEach((pair) => {
        if (pair[1] == name) {
            id =  pair[0]
        }
    });
    return id
}

function getName (id) {
  let name = id;
  idNames.forEach((pair) =>  {
    if (pair[0] == id) {
      name = pair[1]
    }
  });
  return name
}

function removeId (id) {
  for (let i = 0; i < idNames.length; i ++) {
    if (idNames[i][0] == id) {
      names.delete(idNames[i][1]);
      idNames.pop(i);
      return true
    }
  }
}


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  const userID = socket.id;
  socket.on('rename', (msg) => {
    if (setNameAndId(userID, msg.split(' ')[1])) {
      console.log(idNames);
      io.to(userID).emit('chat message', `Your name has been changed to ${msg.split(' ')[1]}`)
    } else {
      io.to(userID).emit('chat message', 'that name appears to be taken')
    }
  });
  socket.on('whisper', (msg) => {
    const targetID = getId(msg.split(' ')[1]);
    if (targetID !== false) {
      io.to(targetID).emit('chat message', `${getName(userID)} whispers: ${msg.split(' ').slice(2, msg.split(' ').length + 1).join(' ')}`) 
      io.to(userID).emit('chat message', `You whispered to ${getName(targetID)}: ${msg.split(' ').slice(2, msg.split(' ').length + 1).join(' ')}`)
    } else {
      io.to(userID).emit('chat message', `There is no user ${msg.split(' ')[1]}`)
    }
  });
  socket.on('chat message', (msg) => {
    io.emit('chat message', `${getName(userID)} says: ${msg}`);
  });
  socket.on('disconnect', () => {
    removeId(userID);
  });
});
server.listen(3000, () => {
  console.log('listening on *:3000');
});
