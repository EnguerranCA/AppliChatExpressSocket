
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import twig from 'twig';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);

const prisma = new PrismaClient();

// Twig setup
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
  socket.on('set username', async (name) => {
    username = name;
    // Envoie les 20 derniers messages à l'utilisateur qui vient d'arriver
    const lastMessages = await prisma.message.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    // On les renvoie dans l'ordre chronologique
    socket.emit('chat history', lastMessages.reverse());
  });
  socket.on('chat message', async (msg) => {
    // Enregistre le message en base
    await prisma.message.create({
      data: {
        content: msg,
        pseudo: username
      }
    });
    io.emit('chat message', { user: username, message: msg });
  });

  // R Place: renvoie la grille
//   socket.on('rplace get', () => {
//     socket.emit('rplace grid', rplaceGrid);
//   });

//   // R Place: modifie un pixel
//   socket.on('rplace pixel', ({ idx, color, user }) => {
//     if (typeof idx === 'number' && idx >= 0 && idx < rplaceGrid.length && typeof color === 'string' && typeof user === 'string') {
//       rplaceGrid[idx] = { color, user };
//       io.emit('rplace pixel', { idx, color, user });
//     }
//   });

//   // Document collaboratif
//   if (!global.collabDoc) global.collabDoc = { text: '' };
//   socket.on('collabdoc get', () => {
//     socket.emit('collabdoc init', { text: global.collabDoc.text });
//   });
//   socket.on('collabdoc update', ({ text, user }) => {
//     if (typeof text === 'string') {
//       global.collabDoc.text = text;
//       socket.broadcast.emit('collabdoc update', { text, user });
//     }
//   });
});



// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Chat app running at http://localhost:${PORT}/`);
});