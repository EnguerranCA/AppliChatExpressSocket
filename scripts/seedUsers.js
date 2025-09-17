/**
 * Script pour créer des utilisateurs de test
 * Lance avec: node scripts/seedUsers.js
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedUsers() {
    try {
        // Créer des utilisateurs de test
        const users = [
            { pseudo: 'alice', password: 'password123', email: 'alice@test.com' },
            { pseudo: 'bob', password: 'password123', email: 'bob@test.com' },
            { pseudo: 'charlie', password: 'password123', email: 'charlie@test.com' }
        ];

        for (const userData of users) {
            const existingUser = await prisma.user.findUnique({
                where: { pseudo: userData.pseudo }
            });

            if (!existingUser) {
                await prisma.user.create({ data: userData });
                console.log(`✅ Utilisateur ${userData.pseudo} créé`);
            } else {
                console.log(`⚠️  Utilisateur ${userData.pseudo} existe déjà`);
            }
        }

        console.log('✅ Seed terminé');
    } catch (error) {
        console.error('❌ Erreur lors du seed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedUsers();
