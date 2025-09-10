import { describe, test, expect } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../app.js';

describe('Tests du serveur', () => {
    test('devrait démarrer sans erreur', async () => {
        const app = createApp();
        expect(app).toBeDefined();
    });

    test('test de base de réponse serveur', async () => {
        const app = createApp();
        const response = await request(app).get('/health');
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('status', 'OK');
    });
});