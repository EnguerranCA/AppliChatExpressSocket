import express from 'express';
import path from 'path';
import twig from 'twig';
import session from 'express-session';
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

    // Sessions (pour l'état de connexion)
    app.use(
        session({
            secret: process.env.SESSION_SECRET || 'dev-session-secret',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: false, // en prod derrière HTTPS, mettre true + app.set('trust proxy', 1)
                httpOnly: true,
            },
        })
    );

    // Exposer l'utilisateur à Twig
    app.use((req, res, next) => {
        res.locals.user = req.session?.user || null;
        next();
    });

    // Twig setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'twig');

    // Static files
    app.use(express.static(path.join(__dirname, 'public')));

    // Routes principales
    app.get('/login', (req, res) => {
        if (req.session?.user) {
            return res.redirect('/');
        }
        res.render('login');
    });

    // Page d'accueil: affiche le chat si connecté, sinon le formulaire de connexion
    app.get('/', (req, res) => {
        if (req.session?.user) {
            return res.render('chat');
        }
        return res.render('login');
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

    // Auth routes
    app.post('/api/login', async (req, res) => {
        try {
            const { pseudo, password } = req.body;
            if (!pseudo || !password) {
                return res.status(400).json({ success: false, message: 'Pseudo et mot de passe requis' });
            }

            const result = await authService.login(pseudo, password);
            if (!result.success) {
                return res.status(401).json(result);
            }

            // Sécurise la session: régénérer l'ID et sauvegarder l'utilisateur
            req.session.regenerate((err) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Erreur de session' });
                }
                req.session.user = result.user;
                req.session.save((saveErr) => {
                    if (saveErr) {
                        return res.status(500).json({ success: false, message: 'Erreur de session' });
                    }
                    return res.json(result);
                });
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
    });

    app.post('/api/logout', (req, res) => {
        if (!req.session) return res.status(200).json({ success: true });
        req.session.destroy(() => {
            res.clearCookie('connect.sid');
            return res.status(200).json({ success: true });
        });
    });

    // Route GET /logout pour déconnexion via navigateur
    app.get('/logout', (req, res) => {
        if (!req.session) {
            return res.redirect('/login');
        }
        req.session.destroy((err) => {
            if (err) {
                console.error('Erreur lors de la destruction de la session:', err);
            }
            res.clearCookie('connect.sid');
            res.redirect('/login');
        });
    });

    // Alias REST pour le login: POST /login (identique à /api/login)
    app.post('/login', async (req, res) => {
        try {
            const { pseudo, password } = req.body;
            if (!pseudo || !password) {
                return res.status(400).json({ success: false, message: 'Pseudo et mot de passe requis' });
            }

            const result = await authService.login(pseudo, password);
            if (!result.success) {
                return res.status(401).json(result);
            }

            req.session.regenerate((err) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Erreur de session' });
                }
                req.session.user = result.user;
                req.session.save((saveErr) => {
                    if (saveErr) {
                        return res.status(500).json({ success: false, message: 'Erreur de session' });
                    }
                    return res.json(result);
                });
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
    });

    // Route de santé pour les tests
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    return app;
}
