// Constantes partagées côté client
// Cette version doit rester synchronisée avec constants/shared.js

/**
 * Palette de couleurs utilisée pour les pseudos utilisateur
 */
const USERNAME_COLORS = [
    '#FF69B4', '#1E90FF', '#32CD32', '#FFD700', '#FF4500', '#8A2BE2', 
    '#00CED1', '#FF6347', '#00FF7F', '#FFB6C1', '#20B2AA', '#FF8C00', 
    '#7FFF00', '#DC143C', '#00BFFF', '#ADFF2F', '#FF00FF', '#40E0D0', 
    '#FF1493', '#00FA9A'
];

/**
 * Génère une couleur pseudo unique façon Twitch
 * @param {string} name - Le nom d'utilisateur
 * @returns {string} - Code couleur hexadécimal
 */
function getUsernameColor(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return USERNAME_COLORS[Math.abs(hash) % USERNAME_COLORS.length];
}
