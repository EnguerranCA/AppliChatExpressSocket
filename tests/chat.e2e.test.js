/**
 * Test End-to-End (E2E) du chat avec Playwright + Jest (ESM)
 * Ce test démarre un serveur HTTP + Socket.IO en mémoire et simule deux utilisateurs.
 */

import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { chromium } from 'playwright';
import { createApp } from '../app.js';
import { MessageService } from '../services/messageService.js';
import { setupSocketHandlers } from '../sockets/chatSocket.js';

let server;
let io;
let port;
const SERVER_HOST = 'http://localhost';

describe('Chat E2E', () => {
    beforeAll(async () => {
        // Démarre l'app + Socket.IO sur un port dynamique
        const messageService = new MessageService();
        const app = createApp(messageService);
        server = http.createServer(app);
        io = new SocketIOServer(server);
        setupSocketHandlers(io, messageService);
        await new Promise((resolve) => {
            server.listen(0, () => {
                port = server.address().port;
                resolve();
            });
        });
    });

    afterAll(async () => {
        // Arrête Socket.IO et le serveur
        if (io) io.close();
        if (server) await new Promise((resolve) => server.close(resolve));
    });

    test('Deux utilisateurs peuvent chatter en temps réel', async () => {
        const SERVER_URL = `${SERVER_HOST}:${port}`;
        // Lance deux navigateurs (utilisateurs)
        const browser1 = await chromium.launch();
        const browser2 = await chromium.launch();
        const page1 = await browser1.newPage();
        const page2 = await browser2.newPage();

        // Utilisateur 1 : login
        await page1.goto(`${SERVER_URL}/login`);
        await page1.fill('#pseudo-input', 'Alice');
        await page1.click('#pseudo-btn');
        await page1.waitForURL(`${SERVER_URL}/`);

        // Utilisateur 2 : login
        await page2.goto(`${SERVER_URL}/login`);
        await page2.fill('#pseudo-input', 'Bob');
        await page2.click('#pseudo-btn');
        await page2.waitForURL(`${SERVER_URL}/`);

        // Alice envoie un message
        await page1.fill('#input', 'Hello Bob!');
        await page1.click('#send');

        // Bob doit voir le message précis
        await page2.waitForSelector('li:has-text("Alice: Hello Bob!")');

        // Bob répond
        await page2.fill('#input', 'Hi Alice!');
        await page2.click('#send');

        // Alice doit voir la réponse précise
        await page1.waitForSelector('li:has-text("Bob: Hi Alice!")');

        await browser1.close();
        await browser2.close();
    }, 25000);
});
