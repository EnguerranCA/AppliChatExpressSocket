import { validateMessage } from '../utils/messageFormatter.js';

/**
 * Configure la logique Socket.IO pour le chat
 * @param {SocketIOServer} io - Instance Socket.IO
 * @param {MessageService} messageService - Service pour les messages
 * @returns {SocketIOServer} - Instance configurée
 */
export function setupSocketHandlers(io, messageService) {
    io.on('connection', (socket) => {
        let username = '';

        console.log(`Nouvelle connexion Socket.IO: ${socket.id}`);

        // Événement: définir le nom d'utilisateur
        socket.on('set username', async (name) => {
            try {
                if (!name || typeof name !== 'string' || name.trim().length === 0) {
                    socket.emit('error', 'Nom d\'utilisateur invalide');
                    return;
                }

                username = name.trim();
                console.log(`Utilisateur ${username} connecté (${socket.id})`);

                // Envoie l'historique des messages
                const lastMessages = await messageService.getLastMessages(20);
                socket.emit('chat history', lastMessages);

                // Notifie les autres utilisateurs
                socket.broadcast.emit('user joined', { username });

            } catch (error) {
                console.error('Erreur lors de la connexion utilisateur:', error);
                socket.emit('error', 'Erreur lors de la récupération de l\'historique');
            }
        });

        // Événement: nouveau message de chat
        socket.on('chat message', async (msg) => {
            try {
                if (!username) {
                    socket.emit('error', 'Vous devez définir un nom d\'utilisateur');
                    return;
                }

                // Validation du message
                const validation = validateMessage(msg, username);
                if (!validation.isValid) {
                    socket.emit('error', validation.errors.join(', '));
                    return;
                }

                // Sauvegarde en base de données
                const savedMessage = await messageService.createMessage(msg, username);

                // Diffusion à tous les clients connectés
                const messageData = {
                    id: savedMessage.id,
                    user: username,
                    message: msg,
                    timestamp: savedMessage.createdAt
                };

                io.emit('chat message', messageData);
                console.log(`Message de ${username}: ${msg}`);

            } catch (error) {
                console.error('Erreur lors de l\'envoi du message:', error);
                socket.emit('error', 'Erreur lors de l\'envoi du message');
            }
        });

        // Événement: récupération de l'historique
        socket.on('get history', async (limit = 20) => {
            try {
                const messages = await messageService.getLastMessages(limit);
                socket.emit('chat history', messages);
            } catch (error) {
                console.error('Erreur lors de la récupération de l\'historique:', error);
                socket.emit('error', 'Erreur lors de la récupération de l\'historique');
            }
        });

        // Événement: déconnexion
        socket.on('disconnect', () => {
            if (username) {
                console.log(`Utilisateur ${username} déconnecté (${socket.id})`);
                socket.broadcast.emit('user left', { username });
            } else {
                console.log(`Connexion anonyme déconnectée (${socket.id})`);
            }
        });

        // Gestion des erreurs Socket.IO
        socket.on('error', (error) => {
            console.error(`Erreur Socket.IO pour ${socket.id}:`, error);
        });
    });

    return io;
}

/**
 * Crée un serveur de test avec Socket.IO
 * @param {MessageService} messageService - Service pour les messages
 * @returns {Object} - { server, io, app }
 */
export function createTestServer(messageService) {
    import('http').then(http => {
        import('socket.io').then(({ Server }) => {
            import('../app.js').then(({ createApp }) => {
                const app = createApp(messageService);
                const server = http.createServer(app);
                const io = new Server(httpServer, {
                    cors: {
                        origin: FRONT_URL,
                        credentials: true
                    }
                });


                setupSocketHandlers(io, messageService);

                return { server, io, app };
            });
        });
    });
}
