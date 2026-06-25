import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

const { mockFindAll, mockFindBy, mockInsert } = vi.hoisted(() => ({
  mockFindAll: vi.fn(),
  mockFindBy: vi.fn(),
  mockInsert: vi.fn(),
}));

vi.mock('../../../src/db.js', () => ({
  findAll: mockFindAll,
  findById: vi.fn(),
  findBy: mockFindBy,
  insert: mockInsert,
  update: vi.fn(),
  remove: vi.fn(),
  getNextId: vi.fn(),
  reset: vi.fn(),
  getTableConfig: vi.fn(),
  save: vi.fn(),
}));

const authService = await import('../../../src/services/authService.js');

describe('authService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('login', () => {
    it('retourne token et user si identifiants valides', async () => {
      const users = [{ id: 1, username: 'admin', password: 'admin123', role: 'admin' }];
      mockFindAll.mockReturnValue(users);
      const result = await authService.login('admin', 'admin123');
      expect(result).toBeTruthy();
      expect(result.token).toBeDefined();
      expect(result.user.username).toBe('admin');
      expect(result.user.role).toBe('admin');
    });

    it('retourne null si identifiants invalides', async () => {
      mockFindAll.mockReturnValue([]);
      expect(await authService.login('wrong', 'creds')).toBeNull();
    });
  });

  describe('register', () => {
    it('crée un utilisateur et retourne token', async () => {
      mockFindAll.mockReturnValue([]);
      mockInsert.mockReturnValue({ id: 1, username: 'newuser', password: 'pass', role: 'user' });
      const result = await authService.register('newuser', 'pass');
      expect(result).toBeTruthy();
      expect(result.user.username).toBe('newuser');
    });

    it('retourne null si nom d\'utilisateur existe déjà', async () => {
      mockFindAll.mockReturnValue([{ id: 1, username: 'existing', password: 'pass', role: 'user' }]);
      expect(await authService.register('existing', 'pass')).toBeNull();
    });
  });

  describe('verifyToken', () => {
    it('retourne le payload si token valide', () => {
      const payload = authService.verifyToken(jwt.sign({ id: 1, role: 'admin' }, process.env.JWT_SECRET || 'fallback_secret'));
      expect(payload).toBeTruthy();
      expect(payload.id).toBe(1);
    });

    it('retourne null si token invalide', () => {
      expect(authService.verifyToken('invalid-token')).toBeNull();
    });
  });
});
