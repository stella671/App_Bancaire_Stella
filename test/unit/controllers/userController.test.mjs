import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFindAll = vi.hoisted(() => vi.fn());
const mockFindBy = vi.hoisted(() => vi.fn());
const mockInsert = vi.hoisted(() => vi.fn());
const mockRemove = vi.hoisted(() => vi.fn());

vi.mock('../../../src/db.js', () => ({
  findAll: mockFindAll,
  findById: vi.fn(),
  findBy: mockFindBy,
  insert: mockInsert,
  update: vi.fn(),
  remove: mockRemove,
  getNextId: vi.fn(),
  reset: vi.fn(),
  getTableConfig: vi.fn(),
  save: vi.fn(),
}));

const { getAll, create, remove } = await import('../../../src/controllers/userController.js');

describe('userController', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { body: {}, user: { id: 1 }, params: {} };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn(), end: vi.fn() };
    next = vi.fn();
  });

  describe('getAll', () => {
    it('retourne tous les utilisateurs sans mot de passe', async () => {
      mockFindAll.mockReturnValue([{ id: 1, username: 'admin', password: 'secret', role: 'admin' }]);
      await getAll(req, res, next);
      expect(res.json).toHaveBeenCalledWith([{ id: 1, username: 'admin', role: 'admin' }]);
    });

    it('passe l\'erreur à next', async () => {
      mockFindAll.mockImplementation(() => { throw new Error('DB error'); });
      await getAll(req, res, next);
      expect(next).toHaveBeenCalledWith(new Error('DB error'));
    });
  });

  describe('create', () => {
    it('retourne 201', async () => {
      req.body = { username: 'new', password: 'pass' };
      mockFindBy.mockReturnValue([]);
      mockInsert.mockReturnValue({ id: 2, username: 'new', password: 'pass', role: 'user' });
      await create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('retourne 400 si username manquant', async () => {
      req.body = { password: 'pass' };
      await create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retourne 400 si password manquant', async () => {
      req.body = { username: 'new' };
      await create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retourne 409 si nom d\'utilisateur existe', async () => {
      req.body = { username: 'existing', password: 'pass' };
      mockFindBy.mockReturnValue([{ id: 1 }]);
      await create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('passe l\'erreur à next', async () => {
      req.body = { username: 'new', password: 'pass' };
      mockFindBy.mockReturnValue([]);
      mockInsert.mockImplementation(() => { throw new Error('DB error'); });
      await create(req, res, next);
      expect(next).toHaveBeenCalledWith(new Error('DB error'));
    });
  });

  describe('remove', () => {
    it('retourne 204 si supprimé', async () => {
      req.params = { id: 2 };
      mockRemove.mockReturnValue(true);
      await remove(req, res, next);
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('retourne 400 si auto-suppression', async () => {
      req.params = { id: 1 };
      await remove(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retourne 404 si introuvable', async () => {
      req.params = { id: 2 };
      mockRemove.mockReturnValue(false);
      await remove(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('passe l\'erreur à next', async () => {
      req.params = { id: 2 };
      mockRemove.mockImplementation(() => { throw new Error('DB error'); });
      await remove(req, res, next);
      expect(next).toHaveBeenCalledWith(new Error('DB error'));
    });
  });
});
