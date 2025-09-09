// Configuration globale pour Jest
// Gestion des warnings de console après les tests

const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeAll(() => {
  // Silence les logs Socket.IO pendant les tests si nécessaire
  jest.spyOn(console, 'error').mockImplementation((message) => {
    // Filtrer les messages de déconnexion Socket.IO après les tests
    if (typeof message === 'string' && message.includes('Cannot log after tests are done')) {
      return;
    }
    originalConsoleError(message);
  });
});

afterAll(() => {
  // Restaurer les fonctions console originales
  console.error.mockRestore?.();
});

// Augmenter la limite des EventEmitters pour les tests Socket.IO
if (process.env.NODE_ENV === 'test') {
  process.setMaxListeners(20);
}
