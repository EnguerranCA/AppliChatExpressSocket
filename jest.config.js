export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    '*.js',
    'utils/**/*.js',
    'services/**/*.js',
    'sockets/**/*.js',
    '!server.js',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 20000 // Augmenté pour les tests d'intégration Socket.IO
};
""