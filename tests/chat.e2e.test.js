/**
 * Test End-to-End (E2E) du chat avec Playwright + Jest (ESM)
 * Ce test démarre un serveur HTTP + Socket.IO en mémoire et simule deux utilisateurs.
 */

import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { chromium } from 'playwright';
import { createApp } from '../app.js';
import { MessageService } from '../services/messageService.js';
import { AuthService } from '../services/authService.js';
import { setupSocketHandlers } from '../sockets/chatSocket.js';

let server;
let io;
let port;
const SERVER_HOST = 'http://localhost';

describe('Chat E2E', () => {
    beforeAll(async () => {
        // Démarre l'app + Socket.IO sur un port dynamique
        const messageService = new MessageService();
        const authService = new AuthService();
        const app = createApp(messageService);
        server = http.createServer(app);
        io = new SocketIOServer(server);
        setupSocketHandlers(io, messageService);
        
        await new Promise((resolve) => {
            server.listen(0, () => {
                port = server.address().port;
                console.log(`Test server running on port ${port}`);
                resolve();
            });
        });

        // Crée des utilisateurs de test après le démarrage du serveur
        try {
            await authService.register('Alice', '123', 'alice@test.com');
            await authService.register('Bob', '123', 'bob@test.com');
            console.log('Test users created successfully');
        } catch (error) {
            console.log('Users may already exist:', error.message);
        }
    });

    afterAll(async () => {
        // Arrête Socket.IO et le serveur
        try {
            if (io) {
                io.close();
                console.log('Socket.IO server closed');
            }
            if (server) {
                await new Promise((resolve, reject) => {
                    server.close((err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
                console.log('HTTP server closed');
            }
        } catch (error) {
            console.error('Error closing servers:', error);
        }
    });

    test('Connexion, chat et déconnexion avec authentification', async () => {
        const SERVER_URL = `${SERVER_HOST}:${port}`;
        // Lance deux navigateurs (utilisateurs)
        const browser1 = await chromium.launch({ headless: true });
        const browser2 = await chromium.launch({ headless: true });
        const page1 = await browser1.newPage();
        const page2 = await browser2.newPage();

        try {
            // Utilisateur 1 (Alice) : connexion avec mot de passe
            await page1.goto(`${SERVER_URL}/`);
            await page1.fill('#pseudo-input', 'Alice');
            await page1.fill('#password-input', '123');
            await page1.click('#login-btn');
            
            // Attendre que la page soit rechargée et que le chat soit visible
            await page1.waitForSelector('#messages', { timeout: 15000 });

            // Utilisateur 2 (Bob) : connexion avec mot de passe
            await page2.goto(`${SERVER_URL}/`);
            await page2.fill('#pseudo-input', 'Bob');
            await page2.fill('#password-input', '123');
            await page2.click('#login-btn');
            
            // Attendre que la page soit rechargée et que le chat soit visible
            await page2.waitForSelector('#messages', { timeout: 15000 });

            // Alice envoie un message
            await page1.fill('#input', 'Hello Bob!');
            await page1.click('#send');

            // Bob doit voir le message précis
            await page2.waitForSelector('li:has-text("Alice: Hello Bob!")', { timeout: 10000 });

            // Bob répond
            await page2.fill('#input', 'Hi Alice!');
            await page2.click('#send');

            // Alice doit voir la réponse précise
            await page1.waitForSelector('li:has-text("Bob: Hi Alice!")', { timeout: 10000 });

            // Test de déconnexion - Alice se déconnecte
            page1.on('dialog', async dialog => {
                await dialog.accept();
            });
            await page1.click('#logout-btn');
            
            // Alice devrait être redirigée vers la page de login
            await page1.waitForSelector('#login-form', { timeout: 10000 });
            
            // Vérifier qu'Alice est bien sur la page de login
            const loginTitle = await page1.textContent('h2');
            expect(loginTitle).toContain('Connexion au chat');

        } finally {
            await browser1.close();
            await browser2.close();
        }
    }, 45000);

    test('Échec de connexion avec mauvais mot de passe', async () => {
        const SERVER_URL = `${SERVER_HOST}:${port}`;
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        try {
            // Tentative de connexion avec mauvais mot de passe
            await page.goto(`${SERVER_URL}/`);
            await page.fill('#pseudo-input', 'Alice');
            await page.fill('#password-input', 'mauvais-mot-de-passe');
            
            // Écouter les alertes JavaScript
            let alertMessage = '';
            page.on('dialog', async dialog => {
                alertMessage = dialog.message();
                await dialog.accept();
            });
            
            await page.click('#login-btn');
            
            // Attendre un peu pour que l'alerte apparaisse
            await page.waitForTimeout(3000);
            
            // Vérifier que l'utilisateur reste sur la page de login
            const loginForm = await page.$('#login-form');
            expect(loginForm).toBeTruthy();
            
            // Vérifier le message d'erreur (peut être "Mot de passe incorrect" ou "Utilisateur introuvable")
            expect(alertMessage).toMatch(/Mot de passe incorrect|Utilisateur introuvable/);

        } finally {
            await browser.close();
        }
    }, 15000);
});
