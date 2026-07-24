// Setup global para todos los tests — NO es código de producción (src/)

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DB_NAME = 'desapp_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'password';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';

afterEach(() => {
  jest.clearAllMocks();
});
