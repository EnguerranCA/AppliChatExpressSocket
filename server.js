
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const path = require('path');

// Twig setup
const twig = require('twig');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Page de login (pseudo)
app.get('/login', (req, res) => {
  res.render('login');
});

// Main chat page
app.get('/', (req, res) => {
  res.render('chat');
});

// Socket.IO logic
let rplaceGrid = Array(16 * 16).fill().map(() => ({ color: '#FFFFFF', user: '' }));
io.on('connection', (socket) => {
  let username = '';
  socket.on('set username', (name) => {
    username = name;
  });
  socket.on('chat message', (msg) => {
    io.emit('chat message', { user: username, message: msg });
  });

  // R Place: renvoie la grille
  socket.on('rplace get', () => {
    socket.emit('rplace grid', rplaceGrid);
  });

  // R Place: modifie un pixel
  socket.on('rplace pixel', ({ idx, color, user }) => {
    if (typeof idx === 'number' && idx >= 0 && idx < rplaceGrid.length && typeof color === 'string' && typeof user === 'string') {
      rplaceGrid[idx] = { color, user };
      io.emit('rplace pixel', { idx, color, user });
    }
  });

  // Document collaboratif
  if (!global.collabDoc) global.collabDoc = { text: '' };
  socket.on('collabdoc get', () => {
    socket.emit('collabdoc init', { text: global.collabDoc.text });
  });
  socket.on('collabdoc update', ({ text, user }) => {
    if (typeof text === 'string') {
      global.collabDoc.text = text;
      socket.broadcast.emit('collabdoc update', { text, user });
    }
  });
});



// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Chat app running at http://localhost:${PORT}/`);
});