import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCreate = vi.hoisted(() => vi.fn());
const mockGetAll = vi.hoisted(() => vi.fn());
const mockGetById = vi.hoisted(() => vi.fn());

vi.mock('../../../src/services/bankService.js', () => ({
  create: mockCreate,
  getAll: mockGetAll,
  getById: mockGetById,
}));

const { create, getAll, getById } = await import('../../../src/controllers/bankController.js');

describe('bankController', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { body: {}, user: {} };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    next = vi.fn();
  });

  describe('create', () => {
    it('retourne 201 et la banque créée', async () => {
      req.body = { name: 'Banque Test', code: 'TST' };
      mockCreate.mockResolvedValue({ id: 1, name: 'Banque Test', code: 'TST' });
      await create(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: 1, name: 'Banque Test', code: 'TST' });
    });

    it('passe l\'erreur à next', async () => {
      req.body = { name: 'Banque', code: 'TST' };
      mockCreate.mockRejectedValue(new Error('DB error'));
      await create(req, res, next);
      expect(next).toHaveBeenCalledWith(new Error('DB error'));
    });

  });

  describe('getAll', () => {
    it('retourne toutes les banques', async () => {
      mockGetAll.mockResolvedValue([{ id: 1, name: 'BNP' }]);
      await getAll(req, res, next);
      expect(res.json).toHaveBeenCalledWith([{ id: 1, name: 'BNP' }]);
    });

    it('passe l\'erreur à next', async () => {
      mockGetAll.mockRejectedValue(new Error('DB error'));
      await getAll(req, res, next);
      expect(next).toHaveBeenCalledWith(new Error('DB error'));
    });
  });

  describe('getById', () => {
    it('retourne la banque si trouvée', async () => {
      req.params = { id: 1 };
      mockGetById.mockResolvedValue({ id: 1, name: 'BNP' });
      await getById(req, res, next);
      expect(res.json).toHaveBeenCalledWith({ id: 1, name: 'BNP' });
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
});
