import { PrismaClient } from '@prisma/client';
import { MESSAGE_CONFIG } from '../constants/shared.js';

export class MessageService {
    constructor(prismaClient = null) {
        this.prisma = prismaClient || new PrismaClient();
    }

    /**
     * Récupère les derniers messages
     * @param {number} limit - Nombre de messages à récupérer
     * @returns {Promise<Array>} - Liste des messages
     */
    async getLastMessages(limit = MESSAGE_CONFIG.DEFAULT_HISTORY_LIMIT) {
        try {
            const messages = await this.prisma.message.findMany({
                orderBy: { createdAt: 'desc' },
                take: limit
            });
            return messages.reverse(); // Ordre chronologique
        } catch (error) {
            throw new Error(`Erreur lors de la récupération des messages: ${error.message}`);
        }
    }

    /**
     * Crée un nouveau message
     * @param {string} content - Contenu du message
     * @param {string} pseudo - Pseudo de l'utilisateur
     * @returns {Promise<Object>} - Message créé
     */
    async createMessage(content, pseudo) {
        try {
            const message = await this.prisma.message.create({
                data: {
                    content,
                    pseudo
                }
            });
            return message;
        } catch (error) {
            throw new Error(`Erreur lors de la création du message: ${error.message}`);
        }
    }

    /**
     * Supprime tous les messages (pour les tests)
     */
    async deleteAllMessages() {
        try {
            await this.prisma.message.deleteMany();
        } catch (error) {
            throw new Error(`Erreur lors de la suppression des messages: ${error.message}`);
        }
    }

    /**
     * Ferme la connexion Prisma
     */
    async disconnect() {
        await this.prisma.$disconnect();
    }
}
