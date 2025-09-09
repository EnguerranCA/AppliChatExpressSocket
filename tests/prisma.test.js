import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { MessageService } from '../services/messageService.js';

// Mock de PrismaClient
const mockPrismaClient = {
    message: {
        findMany: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn()
    },
    $disconnect: jest.fn()
};

describe('Tests des interactions Prisma - MessageService', () => {
    let messageService;

    beforeEach(() => {
        // Réinitialise les mocks avant chaque test
        jest.clearAllMocks();
        messageService = new MessageService(mockPrismaClient);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('getLastMessages', () => {
        test('devrait récupérer les messages et les retourner dans l\'ordre chronologique', async () => {
            const mockMessages = [
                { id: 3, content: 'Message 3', pseudo: 'user3', createdAt: new Date('2023-01-03') },
                { id: 2, content: 'Message 2', pseudo: 'user2', createdAt: new Date('2023-01-02') },
                { id: 1, content: 'Message 1', pseudo: 'user1', createdAt: new Date('2023-01-01') }
            ];

            mockPrismaClient.message.findMany.mockResolvedValue(mockMessages);

            const result = await messageService.getLastMessages(20);

            expect(mockPrismaClient.message.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: 'desc' },
                take: 20
            });

            // Vérifie que les messages sont retournés dans l'ordre chronologique (reverse)
            expect(result).toEqual(mockMessages.reverse());
        });

        test('devrait utiliser la limite par défaut de 20', async () => {
            mockPrismaClient.message.findMany.mockResolvedValue([]);

            await messageService.getLastMessages();

            expect(mockPrismaClient.message.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: 'desc' },
                take: 20
            });
        });

        test('devrait utiliser une limite personnalisée', async () => {
            mockPrismaClient.message.findMany.mockResolvedValue([]);

            await messageService.getLastMessages(5);

            expect(mockPrismaClient.message.findMany).toHaveBeenCalledWith({
                orderBy: { createdAt: 'desc' },
                take: 5
            });
        });

        test('devrait lever une erreur en cas d\'échec de Prisma', async () => {
            const prismaError = new Error('Database connection failed');
            mockPrismaClient.message.findMany.mockRejectedValue(prismaError);

            await expect(messageService.getLastMessages()).rejects.toThrow(
                'Erreur lors de la récupération des messages: Database connection failed'
            );
        });
    });

    describe('createMessage', () => {
        test('devrait créer un nouveau message avec succès', async () => {
            const messageData = {
                content: 'Test message',
                pseudo: 'testuser'
            };

            const mockCreatedMessage = {
                id: 1,
                ...messageData,
                createdAt: new Date('2023-01-01T10:00:00Z')
            };

            mockPrismaClient.message.create.mockResolvedValue(mockCreatedMessage);

            const result = await messageService.createMessage(messageData.content, messageData.pseudo);

            expect(mockPrismaClient.message.create).toHaveBeenCalledWith({
                data: {
                    content: messageData.content,
                    pseudo: messageData.pseudo
                }
            });

            expect(result).toEqual(mockCreatedMessage);
        });

        test('devrait lever une erreur en cas d\'échec de création', async () => {
            const prismaError = new Error('Constraint violation');
            mockPrismaClient.message.create.mockRejectedValue(prismaError);

            await expect(messageService.createMessage('test', 'user')).rejects.toThrow(
                'Erreur lors de la création du message: Constraint violation'
            );
        });
    });

    describe('deleteAllMessages', () => {
        test('devrait supprimer tous les messages', async () => {
            mockPrismaClient.message.deleteMany.mockResolvedValue({ count: 5 });

            await messageService.deleteAllMessages();

            expect(mockPrismaClient.message.deleteMany).toHaveBeenCalledWith();
        });

        test('devrait lever une erreur en cas d\'échec de suppression', async () => {
            const prismaError = new Error('Delete failed');
            mockPrismaClient.message.deleteMany.mockRejectedValue(prismaError);

            await expect(messageService.deleteAllMessages()).rejects.toThrow(
                'Erreur lors de la suppression des messages: Delete failed'
            );
        });
    });

    describe('disconnect', () => {
        test('devrait fermer la connexion Prisma', async () => {
            mockPrismaClient.$disconnect.mockResolvedValue();

            await messageService.disconnect();

            expect(mockPrismaClient.$disconnect).toHaveBeenCalled();
        });
    });

    describe('Integration avec l\'application', () => {
        test('devrait créer et récupérer un message dans un scénario complet', async () => {
            const messageData = {
                content: 'Message d\'intégration',
                pseudo: 'integrationuser'
            };

            const mockCreatedMessage = {
                id: 1,
                ...messageData,
                createdAt: new Date()
            };

            // Mock pour la création
            mockPrismaClient.message.create.mockResolvedValue(mockCreatedMessage);
            
            // Mock pour la récupération
            mockPrismaClient.message.findMany.mockResolvedValue([mockCreatedMessage]);

            // Créer le message
            const createdMessage = await messageService.createMessage(messageData.content, messageData.pseudo);
            expect(createdMessage).toEqual(mockCreatedMessage);

            // Récupérer les messages
            const messages = await messageService.getLastMessages(1);
            expect(messages).toEqual([mockCreatedMessage]);

            // Vérifier que les deux méthodes ont été appelées
            expect(mockPrismaClient.message.create).toHaveBeenCalledTimes(1);
            expect(mockPrismaClient.message.findMany).toHaveBeenCalledTimes(1);
        });
    });
});