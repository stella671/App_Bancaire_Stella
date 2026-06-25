import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.hoisted(() => vi.fn());
const mockGetAll = vi.hoisted(() => vi.fn());
const mockGetById = vi.hoisted(() => vi.fn());
const mockGetByBank = vi.hoisted(() => vi.fn());
const mockRemove = vi.hoisted(() => vi.fn());
const mockUpdate = vi.hoisted(() => vi.fn());
const mockDbFindById = vi.hoisted(() => vi.fn());

vi.mock('../../../src/services/accountService.js', () => ({
  create: mockCreate,
  getAll: mockGetAll,
  getById: mockGetById,
  getByBank: mockGetByBank,
  remove: mockRemove,
  update: mockUpdate,
}));

vi.mock('../../../src/db.js', () => ({
  findById: mockDbFindById,
}));

const { create, getAll, getById, getByBank, remove, update } = await import('../../../src/controllers/accountController.js');

describe('accountController', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { body: {}, user: { role: 'admin' }, params: {} };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn(), end: vi.fn() };
    next = vi.fn();
  });

  describe('create', () => {
    it('retourne 201 avec admin userId', async () => {
      req.body = { bankId: 1 };
      req.user = { role: 'admin' };
      mockCreate.mockResolvedValue({ id: 1 });
      await create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('retourne 201 avec admin et userId explicite', async () => {
      req.body = { bankId: 1, userId: 2 };
      req.user = { role: 'admin' };
      mockCreate.mockResolvedValue({ id: 1 });
      await create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('retourne 201 avec user non-admin', async () => {
      req.body = { bankId: 1 };
      req.user = { role: 'user', id: 5 };
      mockCreate.mockResolvedValue({ id: 1 });
      await create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('retourne 404 si banque introuvable', async () => {
      req.body = { bankId: 999 };
      req.user = { role: 'admin' };
      mockCreate.mockResolvedValue(null);
      await create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('passe l\'erreur à next', async () => {
      req.body = { bankId: 1 };
      mockCreate.mockRejectedValue(new Error('DB error'));
      await create(req, res, next);
      expect(next).toHaveBeenCalledWith(new Error('DB error'));
    });
  });

  describe('getAll', () => {
    it('retourne tous les comptes', async () => {
      mockGetAll.mockResolvedValue([{ id: 1 }]);
      await getAll(req, res, next);
      expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
    });

    it('passe l\'erreur à next', async () => {
      mockGetAll.mockRejectedValue(new Error('DB error'));
      await getAll(req, res, next);
      expect(next).toHaveBeenCalledWith(new Error('DB error'));
    });
  });

  describe('getById', () => {
    it('retourne le compte si trouvé', async () => {
      req.params = { id: 1 };
      mockGetById.mockResolvedValue({ id: 1 });
      await getById(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ id: 1 });
    });

    it('retourne 404 si introuvable', async () => {
      req.params = { id: 999 };
      mockGetById.mockResolvedValue(null);
      await getById(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('passe l\'erreur à next', async () => {
      req.params = { id: 1 };
      mockGetById.mockRejectedValue(new Error('DB error'));
      await getById(req, res, next);
      expect(next).toHaveBeenCalledWith(new Error('DB error'));
    });
  });

  describe('getByBank', () => {
    it('retourne les comptes d\'une banque', async () => {
      req.params = { bankId: 1 };
      mockGetByBank.mockResolvedValue([{ id: 1 }]);
      await getByBank(req, res, next);
      expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
    });

    it('retourne 404 si banque introuvable', async () => {
      req.params = { bankId: 999 };
      mockGetByBank.mockResolvedValue(null);
      await getByBank(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('passe l\'erreur à next', async () => {
      req.params = { bankId: 1 };
      mockGetByBank.mockRejectedValue(new Error('DB error'));
      await getByBank(req, res, next);
      expect(next).toHaveBeenCalledWith(new Error('DB error'));
    });
  });

  describe('remove', () => {
    it('retourne 204 si supprimé', async () => {
      req.params = { id: 1 };
      req.user = { role: 'admin', id: 1 };
      mockGetById.mockResolvedValue({ id: 1, user_id: 2 });
      mockRemove.mockResolvedValue(true);
      await remove(req, res, next);
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('retourne 404 si introuvable', async () => {
      req.params = { id: 999 };
      mockGetById.mockResolvedValue(null);
      await remove(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('retourne 403 si non-admin supprime un compte qui n\'est pas le sien', async () => {
      req.params = { id: 1 };
      req.user = { role: 'user', id: 3 };
      mockGetById.mockResolvedValue({ id: 1, user_id: 2 });
      await remove(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('passe l\'erreur à next', async () => {
      req.params = { id: 1 };
      req.user = { role: 'admin' };
      mockGetById.mockResolvedValue({ id: 1, user_id: 2 });
      mockRemove.mockRejectedValue(new Error('DB error'));
      await remove(req, res, next);
      expect(next).toHaveBeenCalledWith(new Error('DB error'));
    });
  });

  describe('update', () => {
    it('retourne le compte modifié avec bank_name', async () => {
      req.params = { id: 1 };
      req.body = { ownerName: 'New', ownerEmail: 'new@mail.com', accountType: 'SAVINGS' };
      mockUpdate.mockResolvedValue({ id: 1, bank_id: 1, owner_name: 'New' });
      mockDbFindById.mockReturnValue({ id: 1, name: 'BNP' });
      await update(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ bank_name: 'BNP' }));
    });

    it('retourne le compte modifié avec status', async () => {
      req.params = { id: 1 };
      req.body = { ownerName: 'New', status: 'SUSPENDED' };
      mockUpdate.mockResolvedValue({ id: 1, bank_id: 1, status: 'SUSPENDED' });
      mockDbFindById.mockReturnValue({ id: 1, name: 'BNP' });
      await update(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'SUSPENDED' }));
    });

    it('retourne null bank_name si banque introuvable', async () => {
      req.params = { id: 1 };
      req.body = { ownerName: 'New' };
      mockUpdate.mockResolvedValue({ id: 1, bank_id: 999 });
      mockDbFindById.mockReturnValue(null);
      await update(req, res, next);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ bank_name: null }));
    });

    it('retourne 404 si introuvable', async () => {
      req.params = { id: 999 };
      req.body = { ownerName: 'New' };
      mockUpdate.mockResolvedValue(null);
      await update(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('passe l\'erreur à next', async () => {
      req.params = { id: 1 };
      req.body = { ownerName: 'New' };
      mockUpdate.mockRejectedValue(new Error('DB error'));
      await update(req, res, next);
      expect(next).toHaveBeenCalledWith(new Error('DB error'));
    });
  });
});
