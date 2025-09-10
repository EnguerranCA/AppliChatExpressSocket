import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach, jest } from '@jest/globals';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as Client } from 'socket.io-client';
import { createApp } from '../app.js';
import { MessageService } from '../services/messageService.js';
import { setupSocketHandlers } from '../sockets/chatSocket.js';

describe('Tests d\'intégration Socket.IO', () => {
    let server;
    let io;
    let clientSocket;
    let serverSocket;
    let messageService;
    let mockPrismaClient;
    let port;

    beforeAll((done) => {
        // Mock de PrismaClient pour les tests
        mockPrismaClient = {
            message: {
                findMany: jest.fn(),
                create: jest.fn(),
                deleteMany: jest.fn()
            },
            $disconnect: jest.fn()
        };

        messageService = new MessageService(mockPrismaClient);
        
        // Création du serveur de test
        const app = createApp(messageService);
        server = createServer(app);
        io = new SocketIOServer(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        setupSocketHandlers(io, messageService);

        server.listen(() => {
            port = server.address().port;
            done();
        });
    });

    afterAll((done) => {
        // Fermeture de toutes les connexions Socket.IO
        io.close(() => {
            server.close(() => {
                // Attendre un peu pour que toutes les déconnexions se terminent
                setTimeout(done, 100);
            });
        });
    });

    beforeEach((done) => {
        // Reset des mocks
        jest.clearAllMocks();
        
        // Configuration des mocks par défaut
        mockPrismaClient.message.findMany.mockResolvedValue([]);
        mockPrismaClient.message.create.mockResolvedValue({
            id: 1,
            content: 'Test message',
            pseudo: 'testuser',
            createdAt: new Date()
        });

        // Connexion du client de test
        clientSocket = Client(`http://localhost:${port}`, {
            forceNew: true,
            transports: ['websocket']
        });

        io.on('connection', (socket) => {
            serverSocket = socket;
        });

        clientSocket.on('connect', done);
    });

    afterEach((done) => {
        if (clientSocket && clientSocket.connected) {
            clientSocket.disconnect();
        }
        // Petit délai pour permettre la déconnexion propre
        setTimeout(done, 50);
    });

    describe('Connexion et authentification', () => {
        test('devrait établir une connexion Socket.IO', (done) => {
            expect(clientSocket.connected).toBe(true);
            done();
        });

        test('devrait définir un nom d\'utilisateur valide', (done) => {
            const username = 'testuser';
            
            clientSocket.emit('set username', username);
            
            clientSocket.on('chat history', (messages) => {
                expect(Array.isArray(messages)).toBe(true);
                expect(mockPrismaClient.message.findMany).toHaveBeenCalledWith({
                    orderBy: { createdAt: 'desc' },
                    take: 20
                });
                done();
            });
        });

        test('devrait rejeter un nom d\'utilisateur invalide', (done) => {
            clientSocket.emit('set username', '');
            
            clientSocket.on('error', (error) => {
                expect(error).toBe('Nom d\'utilisateur invalide');
                done();
            });
        });

        test('devrait notifier les autres utilisateurs lors de la connexion', (done) => {
            const client2 = Client(`http://localhost:${port}`, {
                forceNew: true,
                transports: ['websocket']
            });

            client2.on('connect', () => {
                clientSocket.emit('set username', 'user1');
                
                client2.on('user joined', (data) => {
                    expect(data.username).toBe('user1');
                    client2.disconnect();
                    setTimeout(done, 50);
                });
            });
        });
    });

    describe('Envoi et réception de messages', () => {
        beforeEach((done) => {
            clientSocket.emit('set username', 'testuser');
            clientSocket.on('chat history', () => done());
        });

        test('devrait envoyer et recevoir un message', (done) => {
            const testMessage = 'Hello World!';
            
            clientSocket.emit('chat message', testMessage);
            
            clientSocket.on('chat message', (data) => {
                expect(data.user).toBe('testuser');
                expect(data.message).toBe(testMessage);
                expect(data).toHaveProperty('id');
                expect(data).toHaveProperty('timestamp');
                
                // Vérification que le message a été sauvegardé
                expect(mockPrismaClient.message.create).toHaveBeenCalledWith({
                    data: {
                        content: testMessage,
                        pseudo: 'testuser'
                    }
                });
                
                done();
            });
        });

        test('devrait diffuser le message à tous les clients connectés', (done) => {
            const client2 = Client(`http://localhost:${port}`, {
                forceNew: true,
                transports: ['websocket']
            });
            
            const testMessage = 'Message diffusé';
            let messagesReceived = 0;

            const checkMessage = (data) => {
                expect(data.user).toBe('testuser');
                expect(data.message).toBe(testMessage);
                messagesReceived++;
                
                if (messagesReceived === 2) {
                    client2.disconnect();
                    setTimeout(done, 50);
                }
            };

            client2.on('connect', () => {
                clientSocket.on('chat message', checkMessage);
                client2.on('chat message', checkMessage);
                
                clientSocket.emit('chat message', testMessage);
            });
        });

        test('devrait rejeter un message sans nom d\'utilisateur', (done) => {
            const client2 = Client(`http://localhost:${port}`, {
                forceNew: true,
                transports: ['websocket']
            });

            client2.on('connect', () => {
                client2.emit('chat message', 'Message sans username');
                
                client2.on('error', (error) => {
                    expect(error).toBe('Vous devez définir un nom d\'utilisateur');
                    client2.disconnect();
                    setTimeout(done, 50);
                });
            });
        });

        test('devrait valider le contenu du message', (done) => {
            const longMessage = 'a'.repeat(501); // Message trop long
            
            clientSocket.emit('chat message', longMessage);
            
            clientSocket.on('error', (error) => {
                expect(error).toContain('ne peut pas dépasser');
                done();
            });
        });

        test('devrait gérer les erreurs de base de données', (done) => {
            // Mock d'une erreur Prisma
            mockPrismaClient.message.create.mockRejectedValue(new Error('Database error'));
            
            clientSocket.emit('chat message', 'Test message');
            
            clientSocket.on('error', (error) => {
                expect(error).toBe('Erreur lors de l\'envoi du message');
                done();
            });
        });
    });

    describe('Récupération de l\'historique', () => {
        beforeEach((done) => {
            clientSocket.emit('set username', 'testuser');
            clientSocket.on('chat history', () => done());
        });

        test('devrait récupérer l\'historique des messages', (done) => {
            const now = new Date();
            const mockMessages = [
                { id: 1, content: 'Message 1', pseudo: 'user1', createdAt: now },
                { id: 2, content: 'Message 2', pseudo: 'user2', createdAt: now }
            ];
            
            mockPrismaClient.message.findMany.mockResolvedValue([...mockMessages].reverse());
            
            clientSocket.emit('get history', 10);
            
            clientSocket.on('chat history', (messages) => {
                expect(messages).toHaveLength(2);
                expect(messages[0]).toMatchObject({
                    id: 1,
                    content: 'Message 1',
                    pseudo: 'user1'
                });
                expect(messages[1]).toMatchObject({
                    id: 2,
                    content: 'Message 2',
                    pseudo: 'user2'
                });
                
                expect(mockPrismaClient.message.findMany).toHaveBeenCalledWith({
                    orderBy: { createdAt: 'desc' },
                    take: 10
                });
                done();
            });
        });

        test('devrait gérer les erreurs lors de la récupération de l\'historique', (done) => {
            mockPrismaClient.message.findMany.mockRejectedValue(new Error('Database error'));
            
            clientSocket.emit('get history');
            
            clientSocket.on('error', (error) => {
                expect(error).toBe('Erreur lors de la récupération de l\'historique');
                done();
            });
        });
    });

    describe('Déconnexion', () => {
        test('devrait notifier les autres utilisateurs lors de la déconnexion', (done) => {
            const client2 = Client(`http://localhost:${port}`, {
                forceNew: true,
                transports: ['websocket']
            });

            client2.on('connect', () => {
                clientSocket.emit('set username', 'user1');
                
                client2.on('user left', (data) => {
                    expect(data.username).toBe('user1');
                    client2.disconnect();
                    setTimeout(done, 50);
                });
                
                // Attendre un peu puis déconnecter
                setTimeout(() => {
                    clientSocket.disconnect();
                }, 100);
            });
        });
    });

    describe('Scénarios d\'intégration complexes', () => {
        test('scénario complet: connexion, envoi de message, historique', async () => {
            const username = 'integrationuser';
            const testMessage = 'Message d\'intégration';

            // Mock des messages existants
            const existingMessages = [
                { id: 1, content: 'Message existant', pseudo: 'otheruser', createdAt: new Date() }
            ];
            mockPrismaClient.message.findMany.mockResolvedValue([...existingMessages].reverse());

            return new Promise((resolve) => {
                let step = 0;
                
                // Étape 1: Connexion et récupération de l'historique
                clientSocket.emit('set username', username);
                
                clientSocket.on('chat history', (history) => {
                    if (step === 0) {
                        expect(history).toHaveLength(1);
                        expect(history[0]).toMatchObject({
                            id: 1,
                            content: 'Message existant',
                            pseudo: 'otheruser'
                        });
                        step++;
                        
                        // Étape 2: Envoi d'un nouveau message
                        clientSocket.emit('chat message', testMessage);
                    }
                });
                
                // Étape 3: Réception du message envoyé
                clientSocket.on('chat message', (data) => {
                    expect(data.user).toBe(username);
                    expect(data.message).toBe(testMessage);
                    
                    // Vérifications des appels Prisma
                    expect(mockPrismaClient.message.findMany).toHaveBeenCalled();
                    expect(mockPrismaClient.message.create).toHaveBeenCalledWith({
                        data: {
                            content: testMessage,
                            pseudo: username
                        }
                    });
                    
                    resolve();
                });
            });
        });

        test('gestion simultanée de multiples clients', (done) => {
            const clients = [];
            const numClients = 3;
            let connectedClients = 0;
            let messagesReceived = 0;

            // Créer plusieurs clients
            for (let i = 0; i < numClients; i++) {
                const client = Client(`http://localhost:${port}`, {
                    forceNew: true,
                    transports: ['websocket']
                });

                client.on('connect', () => {
                    client.emit('set username', `user${i}`);
                    connectedClients++;
                    
                    if (connectedClients === numClients) {
                        // Tous les clients sont connectés, envoyer un message depuis le premier
                        clients[0].emit('chat message', 'Message multi-clients');
                    }
                });

                client.on('chat message', (data) => {
                    messagesReceived++;
                    expect(data.user).toBe('user0');
                    expect(data.message).toBe('Message multi-clients');
                    
                    // Quand tous les clients ont reçu le message
                    if (messagesReceived === numClients) {
                        clients.forEach(c => c.disconnect());
                        setTimeout(done, 100);
                    }
                });

                clients.push(client);
            }
        });
    });
});
