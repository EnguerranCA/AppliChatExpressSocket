import express from 'express';
import path from 'path';
import twig from 'twig';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { MessageService } from './services/messageService.js';
import { AuthService } from './services/authService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function createApp(messageService = null) {
    const app = express();
    const msgService = messageService || new MessageService();
    const authService = new AuthService();

    // Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Twig setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'twig');

    // Static files
    app.use(express.static(path.join(__dirname, 'public')));

    // Routes principales
    app.get('/login', (req, res) => {
        res.render('login');
    });

    app.get('/', (req, res) => {
        res.render('chat');
    });

    // Routes d'authentification
    app.post('/api/login', async (req, res) => {
        try {
            const { pseudo, password } = req.body;
            if (!pseudo || !password) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Pseudo et mot de passe requis' 
                });
            }
            
            const result = await authService.login(pseudo, password);
            if (result.success) {
                res.json(result);
            } else {
                res.status(401).json(result);
            }
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Erreur serveur' 
            });
        }
    });

    app.post('/api/register', async (req, res) => {
        try {
            const { pseudo, password, email } = req.body;
            if (!pseudo || !password || !email) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Pseudo, mot de passe et email requis' 
                });
            }
            
            const result = await authService.register(pseudo, password, email);
            if (result.success) {
                res.status(201).json(result);
            } else {
                res.status(400).json(result);
            }
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Erreur serveur' 
            });
        }
    });

    // API Routes pour les tests
    app.get('/api/messages', async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const messages = await msgService.getLastMessages(limit);
            res.json(messages);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/messages', async (req, res) => {
        try {
            const { content, pseudo } = req.body;
            if (!content || !pseudo) {
                return res.status(400).json({ error: 'Content and pseudo are required' });
            }
            
            const message = await msgService.createMessage(content, pseudo);
            res.status(201).json(message);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Route de santé pour les tests
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    return app;
}
