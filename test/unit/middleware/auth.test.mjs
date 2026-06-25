import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

const mockVerifyToken = vi.hoisted(() => vi.fn());

vi.mock('../../../src/services/authService.js', () => ({
  verifyToken: mockVerifyToken,
}));

const { authenticate, adminOnly } = await import('../../../src/middleware/auth.js');

describe('auth middleware', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { headers: {} };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    next = vi.fn();
  });

  describe('authenticate', () => {
    it('passe au next si token valide', () => {
      req.headers.authorization = 'Bearer valid-token';
      mockVerifyToken.mockReturnValue({ id: 1, role: 'admin' });
      authenticate(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({ id: 1, role: 'admin' });
    });

    it('retourne 401 si header Authorization manquant', () => {
      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized', message: 'Token manquant' });
      expect(next).not.toHaveBeenCalled();
    });

    it('retourne 401 si token invalide', () => {
      req.headers.authorization = 'Bearer bad-token';
      mockVerifyToken.mockReturnValue(null);
      authenticate(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized', message: 'Token invalide ou expiré' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('adminOnly', () => {
    it('passe au next si admin', () => {
      req.user = { role: 'admin' };
      adminOnly(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('retourne 403 si non-admin', () => {
      req.user = { role: 'user' };
      adminOnly(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden', message: 'Accès réservé aux administrateurs' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
