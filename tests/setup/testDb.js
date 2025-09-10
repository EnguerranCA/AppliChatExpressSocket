const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function setupTestDatabase() {
    execSync('npx prisma migrate reset --force');
    await prisma.user.create({
        data: {
            name: 'Test User',
            email: 'test@example.com',
        },
    });
}

module.exports = setupTestDatabase;