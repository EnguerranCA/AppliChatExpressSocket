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

// Main chat page
app.get('/', (req, res) => {
  res.render('chat');
});

// Socket.IO logic
io.on('connection', (socket) => {
  let username = '';
  socket.on('set username', (name) => {
    username = name;
  });
  socket.on('chat message', (msg) => {
    io.emit('chat message', { user: username, message: msg });
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Chat app running at http://localhost:${PORT}/`);
});