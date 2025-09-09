
import dotenv from 'dotenv';
dotenv.config();
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createApp } from './app.js';
import { MessageService } from './services/messageService.js';
import { setupSocketHandlers } from './sockets/chatSocket.js';

// Création de l'application et des services
const messageService = new MessageService();
const app = createApp(messageService);
const server = http.createServer(app);
const io = new SocketIOServer(server);

// Configuration Socket.IO
setupSocketHandlers(io, messageService);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Chat app running at http://localhost:${PORT}/`);
});