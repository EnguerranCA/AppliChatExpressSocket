import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuthService {
    /**
     * Connecter un utilisateur (vérifier pseudo + mot de passe)
     */
    async login(pseudo, password) {
        try {
            const user = await prisma.user.findUnique({
                where: { pseudo }
            });

            if (!user) {
                return { success: false, message: 'Utilisateur introuvable' };
            }

            if (!user.isActive) {
                return { success: false, message: 'Compte désactivé' };
            }

            // Vérification mot de passe en clair (temporaire)
            if (user.password !== password) {
                return { success: false, message: 'Mot de passe incorrect' };
            }

            return { 
                success: true, 
                user: { 
                    id: user.id, 
                    pseudo: user.pseudo, 
                    email: user.email 
                },
                token: `temp-token-${user.id}` // Token temporaire
            };
        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            return { success: false, message: 'Erreur serveur' };
        }
    }

    /**
     * Créer un nouvel utilisateur
     */
    async register(pseudo, password, email) {
        try {
            // Vérifier si l'utilisateur existe déjà
            const existingUser = await prisma.user.findFirst({
                where: {
                    OR: [
                        { pseudo },
                        { email }
                    ]
                }
            });

            if (existingUser) {
                return { 
                    success: false, 
                    message: existingUser.pseudo === pseudo ? 'Pseudo déjà utilisé' : 'Email déjà utilisé' 
                };
            }

            const user = await prisma.user.create({
                data: {
                    pseudo,
                    password, // Stockage en clair (temporaire)
                    email
                }
            });

            return { 
                success: true, 
                user: { 
                    id: user.id, 
                    pseudo: user.pseudo, 
                    email: user.email 
                } 
            };
        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            return { success: false, message: 'Erreur serveur' };
        }
    }
}
