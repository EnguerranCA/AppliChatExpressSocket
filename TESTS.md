# Tests de l'application Chat Socket

## 📋 Vue d'ensemble

Cette application dispose d'une suite complète de tests unitaires utilisant **Jest** pour garantir la qualité et la robustesse du code.

## 🏗️ Architecture des tests

### Structure des fichiers

```
tests/
├── messageFormatting.test.js  # Tests des fonctions utilitaires
├── prisma.test.js            # Tests des interactions base de données
├── routes.test.js            # Tests des routes HTTP
└── server.test.js            # Tests généraux du serveur

utils/
└── messageFormatter.js       # Fonctions de formatage et validation

services/
└── messageService.js         # Service d'interaction avec Prisma

constants/
└── shared.js                 # Constantes partagées
```

### Refactoring pour la testabilité

Le code a été restructuré pour séparer les responsabilités :
- **`app.js`** : Application Express pure (sans Socket.IO ni lancement serveur)
- **`server.js`** : Point d'entrée avec Socket.IO et lancement du serveur
- **`services/messageService.js`** : Logique métier pour les messages
- **`utils/messageFormatter.js`** : Fonctions utilitaires pures
- **`constants/shared.js`** : Constantes partagées

## 🧪 Types de tests

### 1. Tests des fonctions utilitaires (`messageFormatting.test.js`)
- **Objectif** : Tester les fonctions pures de formatage et validation
- **Couverture** : 
  - Génération de couleurs utilisateur (`getUsernameColor`)
  - Formatage de messages (`formatMessage`)
  - Validation de messages (`validateMessage`)

**Exemple** :
```javascript
test('devrait formater un message valide correctement', () => {
    const formatted = formatMessage('Hello World!', 'testuser');
    expect(formatted).toHaveProperty('content', 'Hello World!');
    expect(formatted).toHaveProperty('pseudo', 'testuser');
    expect(formatted).toHaveProperty('color');
});
```

### 2. Tests des routes HTTP (`routes.test.js`)
- **Objectif** : Tester que les routes retournent les bons codes HTTP et données
- **Outil** : Supertest pour simuler les requêtes HTTP
- **Couverture** :
  - Routes de rendu (GET `/`, `/login`)
  - API REST (GET/POST `/api/messages`)
  - Route de santé (`/health`)
  - Gestion des erreurs 404

**Exemple** :
```javascript
test('devrait créer un message avec des données valides', async () => {
    const response = await request(app)
        .post('/api/messages')
        .send({ content: 'Test message', pseudo: 'testuser' });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
});
```

### 3. Tests des interactions Prisma (`prisma.test.js`)
- **Objectif** : Tester les interactions avec la base de données
- **Approche** : Mock de PrismaClient pour éviter les dépendances externes
- **Couverture** :
  - Création de messages (`createMessage`)
  - Récupération de messages (`getLastMessages`)
  - Suppression de messages (`deleteAllMessages`)
  - Gestion des erreurs de base de données

**Exemple** :
```javascript
test('devrait récupérer les messages dans l\'ordre chronologique', async () => {
    const mockMessages = [/* messages mockés */];
    mockPrismaClient.message.findMany.mockResolvedValue(mockMessages);
    
    const result = await messageService.getLastMessages(20);
    
    expect(mockPrismaClient.message.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 20
    });
});
```

## 🚀 Commandes disponibles

```bash
# Exécuter tous les tests
npm test

# Tests avec surveillance des changements
npm run test:watch

# Rapport de couverture
npm run test:coverage

# Tests spécifiques
npm run test:routes          # Tests des routes HTTP
npm run test:messages        # Tests de formatage de messages
npm run test:prisma          # Tests des interactions Prisma
```

## 📊 Couverture de code

La suite de tests actuelle atteint **96.72% de couverture** :
- **Statements** : 96.72%
- **Branches** : 100%
- **Functions** : 100%
- **Lines** : 96.66%

## 🔧 Configuration Jest

```javascript
// jest.config.js
export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    '*.js',
    'utils/**/*.js', 
    'services/**/*.js',
    '!server.js',
    '!**/node_modules/**'
  ],
  verbose: true,
  testTimeout: 10000
};
```

## 🎯 Bonnes pratiques implementées

1. **Séparation des responsabilités** : Logique métier séparée de l'infrastructure
2. **Tests unitaires purs** : Pas de dépendances externes (mocking de Prisma)
3. **Tests d'intégration** : Validation des routes HTTP complètes
4. **Validation des erreurs** : Test des cas d'erreur et de validation
5. **Couverture complète** : Tests de tous les chemins de code importants
6. **Documentation** : Tests auto-documentés avec des descriptions claires

## 🔍 Mocage de Prisma

Pour éviter les dépendances à une vraie base de données, PrismaClient est mocké :

```javascript
const mockPrismaClient = {
    message: {
        findMany: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn()
    },
    $disconnect: jest.fn()
};
```

Cela permet :
- Tests rapides et fiables
- Isolation des tests
- Simulation des erreurs de base de données
- Tests sans infrastructure externe

## 🚀 Extension future

La suite de tests peut être étendue avec :
- Tests e2e avec Socket.IO
- Tests de performance
- Tests de sécurité
- Tests d'accessibilité côté client
- Integration avec CI/CD
