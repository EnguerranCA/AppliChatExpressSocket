// Constantes partagées entre client et serveur

/**
 * Palette de couleurs utilisée pour les pseudos utilisateur
 */
export const USERNAME_COLORS = [
    '#FF69B4', '#1E90FF', '#32CD32', '#FFD700', '#FF4500', '#8A2BE2', 
    '#00CED1', '#FF6347', '#00FF7F', '#FFB6C1', '#20B2AA', '#FF8C00', 
    '#7FFF00', '#DC143C', '#00BFFF', '#ADFF2F', '#FF00FF', '#40E0D0', 
    '#FF1493', '#00FA9A'
];

/**
 * Limites de validation des messages
 */
export const MESSAGE_LIMITS = {
    MAX_CONTENT_LENGTH: 500,
    MAX_PSEUDO_LENGTH: 50,
    MIN_PSEUDO_LENGTH: 2
};

/**
 * Configuration par défaut pour les messages
 */
export const MESSAGE_CONFIG = {
    DEFAULT_HISTORY_LIMIT: 20
};
