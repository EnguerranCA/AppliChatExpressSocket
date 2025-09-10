import { describe, test, expect } from '@jest/globals';
import { getUsernameColor, formatMessage, validateMessage } from '../utils/messageFormatter.js';

describe('Tests des fonctions de formatage de messages', () => {
    
    describe('getUsernameColor', () => {
        test('devrait retourner une couleur hexadécimale valide', () => {
            const color = getUsernameColor('testuser');
            
            expect(typeof color).toBe('string');
            expect(color).toMatch(/^#[0-9A-F]{6}$/i);
        });

        test('devrait retourner la même couleur pour le même nom', () => {
            const color1 = getUsernameColor('alice');
            const color2 = getUsernameColor('alice');
            
            expect(color1).toBe(color2);
        });

        test('devrait retourner des couleurs différentes pour des noms différents', () => {
            const color1 = getUsernameColor('alice');
            const color2 = getUsernameColor('bob');
            
            expect(color1).not.toBe(color2);
        });

        test('devrait gérer les noms vides ou invalides', () => {
            const color = getUsernameColor('');
            
            expect(typeof color).toBe('string');
            expect(color).toMatch(/^#[0-9A-F]{6}$/i);
        });
    });

    describe('formatMessage', () => {
        test('devrait formater un message valide correctement', () => {
            const content = 'Hello World!';
            const pseudo = 'testuser';
            const testDate = new Date('2023-01-01T10:00:00Z');
            
            const formatted = formatMessage(content, pseudo, testDate);
            
            expect(formatted).toHaveProperty('content', 'Hello World!');
            expect(formatted).toHaveProperty('pseudo', 'testuser');
            expect(formatted).toHaveProperty('createdAt', testDate);
            expect(formatted).toHaveProperty('color');
            expect(formatted.color).toMatch(/^#[0-9A-F]{6}$/i);
        });

        test('devrait supprimer les espaces en début et fin', () => {
            const formatted = formatMessage('  Hello  ', '  user  ');
            
            expect(formatted.content).toBe('Hello');
            expect(formatted.pseudo).toBe('user');
        });

        test('devrait utiliser la date actuelle par défaut', () => {
            const before = new Date();
            const formatted = formatMessage('test', 'user');
            const after = new Date();
            
            expect(formatted.createdAt).toBeInstanceOf(Date);
            expect(formatted.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
            expect(formatted.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
        });

        test('devrait lever une erreur si content est manquant', () => {
            expect(() => {
                formatMessage('', 'user');
            }).toThrow('Content and pseudo are required');
        });

        test('devrait lever une erreur si pseudo est manquant', () => {
            expect(() => {
                formatMessage('test', '');
            }).toThrow('Content and pseudo are required');
        });
    });

    describe('validateMessage', () => {
        test('devrait valider un message correct', () => {
            const result = validateMessage('Hello World', 'testuser');
            
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        test('devrait rejeter un contenu vide', () => {
            const result = validateMessage('', 'testuser');
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Le contenu du message ne peut pas être vide');
        });

        test('devrait rejeter un contenu null ou undefined', () => {
            const result1 = validateMessage(null, 'testuser');
            const result2 = validateMessage(undefined, 'testuser');
            
            expect(result1.isValid).toBe(false);
            expect(result2.isValid).toBe(false);
        });

        test('devrait rejeter un message trop long', () => {
            const longMessage = 'a'.repeat(501);
            const result = validateMessage(longMessage, 'testuser');
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Le message ne peut pas dépasser 500 caractères');
        });

        test('devrait rejeter un pseudo vide', () => {
            const result = validateMessage('Hello', '');
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Le pseudo ne peut pas être vide');
        });

        test('devrait rejeter un pseudo trop long', () => {
            const longPseudo = 'a'.repeat(51);
            const result = validateMessage('Hello', longPseudo);
            
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Le pseudo ne peut pas dépasser 50 caractères');
        });

        test('devrait accepter un message à la limite de longueur', () => {
            const maxMessage = 'a'.repeat(500);
            const maxPseudo = 'a'.repeat(50);
            const result = validateMessage(maxMessage, maxPseudo);
            
            expect(result.isValid).toBe(true);
        });

        test('devrait retourner plusieurs erreurs si nécessaire', () => {
            const result = validateMessage('', '');
            
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(1);
        });
    });
});