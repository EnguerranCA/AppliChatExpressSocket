import { USERNAME_COLORS, MESSAGE_LIMITS } from '../constants/shared.js';

/**
 * Génère une couleur pseudo unique façon Twitch
 * @param {string} name - Le nom d'utilisateur
 * @returns {string} - Code couleur hexadécimal
 */
export function getUsernameColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return USERNAME_COLORS[Math.abs(hash) % USERNAME_COLORS.length];
}

/**
 * Formate un message pour l'affichage
 * @param {string} content - Le contenu du message
 * @param {string} pseudo - Le pseudo de l'utilisateur
 * @param {Date} createdAt - La date de création
 * @returns {Object} - Message formaté
 */
export function formatMessage(content, pseudo, createdAt = new Date()) {
    if (!content || !pseudo) {
        throw new Error('Content and pseudo are required');
    }
    
    return {
        content: content.trim(),
        pseudo: pseudo.trim(),
        createdAt,
        color: getUsernameColor(pseudo)
    };
}

/**
 * Valide un message avant sauvegarde
 * @param {string} content - Le contenu du message
 * @param {string} pseudo - Le pseudo de l'utilisateur
 * @returns {Object} - Résultat de validation
 */
export function validateMessage(content, pseudo) {
    const errors = [];
    
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
        errors.push('Le contenu du message ne peut pas être vide');
    }
    
    if (content && content.length > MESSAGE_LIMITS.MAX_CONTENT_LENGTH) {
        errors.push(`Le message ne peut pas dépasser ${MESSAGE_LIMITS.MAX_CONTENT_LENGTH} caractères`);
    }
    
    if (!pseudo || typeof pseudo !== 'string' || pseudo.trim().length === 0) {
        errors.push('Le pseudo ne peut pas être vide');
    }
    
    if (pseudo && pseudo.length > MESSAGE_LIMITS.MAX_PSEUDO_LENGTH) {
        errors.push(`Le pseudo ne peut pas dépasser ${MESSAGE_LIMITS.MAX_PSEUDO_LENGTH} caractères`);
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}
