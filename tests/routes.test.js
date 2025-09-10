import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../app.js';

describe('Tests des routes HTTP', () => {
    let app;

    beforeAll(() => {
        app = createApp();
    });

    describe('GET /health', () => {
        test('devrait retourner status 200 et un objet JSON valide', async () => {
            const response = await request(app).get('/health');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('status', 'OK');
            expect(response.body).toHaveProperty('timestamp');
            expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
        });
    });

    describe('GET /', () => {
        test('devrait retourner la page de chat avec status 200', async () => {
            const response = await request(app).get('/');
            
            expect(response.status).toBe(200);
            expect(response.type).toMatch(/html/);
            expect(response.text).toMatch(/<!DOCTYPE html>/);
        });
    });

    describe('GET /login', () => {
        test('devrait retourner la page de login avec status 200', async () => {
            const response = await request(app).get('/login');
            
            expect(response.status).toBe(200);
            expect(response.type).toMatch(/html/);
        });
    });

    describe('GET /api/messages', () => {
        test('devrait retourner une liste de messages avec status 200', async () => {
            const response = await request(app).get('/api/messages');
            
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        test('devrait accepter un paramètre limit', async () => {
            const response = await request(app).get('/api/messages?limit=5');
            
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('POST /api/messages', () => {
        test('devrait créer un message avec des données valides', async () => {
            const messageData = {
                content: 'Test message',
                pseudo: 'testuser'
            };

            const response = await request(app)
                .post('/api/messages')
                .send(messageData);
            
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('content', messageData.content);
            expect(response.body).toHaveProperty('pseudo', messageData.pseudo);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('createdAt');
        });

        test('devrait retourner 400 si content est manquant', async () => {
            const response = await request(app)
                .post('/api/messages')
                .send({ pseudo: 'testuser' });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        test('devrait retourner 400 si pseudo est manquant', async () => {
            const response = await request(app)
                .post('/api/messages')
                .send({ content: 'Test message' });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Routes inexistantes', () => {
        test('devrait retourner 404 pour une route inexistante', async () => {
            const response = await request(app).get('/route-inexistante');
            
            expect(response.status).toBe(404);
        });
    });
});