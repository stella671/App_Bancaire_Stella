import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockLogin = vi.hoisted(() => vi.fn());
const mockRegister = vi.hoisted(() => vi.fn());

vi.mock('../../../src/services/authService.js', () => ({
  login: mockLogin,
  register: mockRegister,
}));

const { login, register } = await import('../../../src/controllers/authController.js');

describe('authController', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { body: {} };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    next = vi.fn();
  });

  describe('login', () => {
    it('retourne 200 et le résultat', async () => {
      req.body = { username: 'admin', password: 'pass' };
      mockLogin.mockResolvedValue({ token: 'abc', user: { id: 1 } });
      await login(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ token: 'abc', user: { id: 1 } });
    });

    it('retourne 400 si username manquant', async () => {
      req.body = { password: 'pass' };
      await login(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retourne 400 si password manquant', async () => {
      req.body = { username: 'admin' };
      await login(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retourne 401 si identifiants invalides', async () => {
      req.body = { username: 'admin', password: 'wrong' };
      mockLogin.mockResolvedValue(null);
      await login(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('passe l\'erreur à next', async () => {
      req.body = { username: 'admin', password: 'pass' };
      mockLogin.mockRejectedValue(new Error('DB error'));
      await login(req, res, next);
      expect(next).toHaveBeenCalledWith(new Error('DB error'));
    });
  });

  describe('register', () => {
    it('retourne 201 et le résultat', async () => {
      req.body = { username: 'new', password: '1234' };
      mockRegister.mockResolvedValue({ token: 'abc', user: { id: 1 } });
      await register(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ token: 'abc', user: { id: 1 } });
    });

    it('retourne 400 si username manquant', async () => {
      req.body = { password: '1234' };
      await register(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retourne 400 si password manquant', async () => {
      req.body = { username: 'new' };
      await register(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retourne 400 si mot de passe trop court', async () => {
      req.body = { username: 'new', password: '123' };
      await register(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retourne 409 si nom d\'utilisateur existe', async () => {
      req.body = { username: 'existing', password: '1234' };
      mockRegister.mockResolvedValue(null);
      await register(req, res, next);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('passe l\'erreur à next', async () => {
      req.body = { username: 'new', password: '1234' };
      mockRegister.mockRejectedValue(new Error('DB error'));
      await register(req, res, next);
      expect(next).toHaveBeenCalledWith(new Error('DB error'));
    });
  });
});
