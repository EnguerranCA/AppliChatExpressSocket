// Configuration globale pour les tests Socket.IO
import { jest } from '@jest/globals';

// Augmente le timeout par défaut pour les tests d'intégration
jest.setTimeout(15000);

// Mock global console pour réduire les logs pendant les tests
const originalConsole = console;
global.console = {
    ...originalConsole,
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
};

// Utilitaires de test pour Socket.IO
global.waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

global.waitForSocketEvent = (socket, eventName, timeout = 5000) => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`Timeout waiting for socket event: ${eventName}`));
        }, timeout);

        socket.once(eventName, (...args) => {
            clearTimeout(timer);
            resolve(args);
        });
    });
};
