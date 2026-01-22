const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.static('public'));

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const PORT = process.env.PORT || 10000;
const rooms = {};

io.on('connection', socket => {
  console.log('Cliente conectado', socket.id);

  socket.on('join_room', ({ roomId, name }) => {
    if (!roomId) return;
    socket.join(roomId);
    if (!rooms[roomId]) rooms[roomId] = { players: {} };
    rooms[roomId].players[socket.id] = { name };
    io.to(roomId).emit('room_state', {
      players: Object.values(rooms[roomId].players)
    });
  });

  socket.on('start_quiz', ({ roomId }) => {
    io.to(roomId).emit('quiz_started');
  });

  socket.on('disconnect', () => {
    for (const roomId of Object.keys(rooms)) {
      if (rooms[roomId].players[socket.id]) {
        delete rooms[roomId].players[socket.id];
        io.to(roomId).emit('room_state', {
          players: Object.values(rooms[roomId].players)
        });
      }
    }
  });
});

app.get('/health', (req, res) => res.json({ ok: true }));

server.listen(PORT, () => {
  console.log('Servidor en puerto', PORT);
});
