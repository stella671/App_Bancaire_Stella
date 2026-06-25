import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDeposit = vi.hoisted(() => vi.fn());
const mockWithdraw = vi.hoisted(() => vi.fn());
const mockTransfer = vi.hoisted(() => vi.fn());
const mockGetAll = vi.hoisted(() => vi.fn());
const mockGetHistory = vi.hoisted(() => vi.fn());
const mockGetArchived = vi.hoisted(() => vi.fn());

vi.mock('../../../src/services/transactionService.js', () => ({
  deposit: mockDeposit,
  withdraw: mockWithdraw,
  transfer: mockTransfer,
  getAll: mockGetAll,
  getHistory: mockGetHistory,
  getArchived: mockGetArchived,
}));

const { deposit, withdraw, transfer, getAll, getHistory, getArchived } = await import('../../../src/controllers/transactionController.js');

describe('transactionController', () => {
  let req, res, next;

  beforeEach(() => {
    vi.clearAllMocks();
    req = { body: {}, user: {}, params: {} };
    res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    next = vi.fn();
  });

  describe('deposit', () => {
    it('retourne 201', async () => {
      mockDeposit.mockResolvedValue({ id: 1, type: 'DEPOSIT' });
      await deposit(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('passe l\'erreur à next', async () => {
      mockDeposit.mockRejectedValue(new Error('DB error'));
      await deposit(req, res, next);
      expect(next).toHaveBeenCalledWith(new Error('DB error'));
    });
  });

  describe('withdraw', () => {
    it('retourne 201', async () => {
      mockWithdraw.mockResolvedValue({ id: 1, type: 'WITHDRAWAL' });
      await withdraw(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('passe l\'erreur à next', async () => {
      mockWithdraw.mockRejectedValue(new Error('DB error'));
      await withdraw(req, res, next);
      expect(next).toHaveBeenCalledWith(new Error('DB error'));
    });
  });

  describe('transfer', () => {
    it('retourne 201', async () => {
      mockTransfer.mockResolvedValue({ id: 1, type: 'TRANSFER' });
      await transfer(req, res, next);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('passe l\'erreur à next', async () => {
      mockTransfer.mockRejectedValue(new Error('DB error'));
      await transfer(req, res, next);
      expect(next).toHaveBeenCalledWith(new Error('DB error'));
    });
  });

  describe('getAll', () => {
    it('retourne toutes les transactions', async () => {
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

  describe('getHistory', () => {
    it('retourne l\'historique', async () => {
      req.params = { accountId: 1 };
      mockGetHistory.mockResolvedValue([{ id: 1 }]);
      await getHistory(req, res, next);
      expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
    });

    it('passe l\'erreur à next', async () => {
      req.params = { accountId: 1 };
      mockGetHistory.mockRejectedValue(new Error('DB error'));
      await getHistory(req, res, next);
      expect(next).toHaveBeenCalledWith(new Error('DB error'));
    });
  });

  describe('getArchived', () => {
    it('retourne les transactions archivées', async () => {
      mockGetArchived.mockResolvedValue([{ id: 1 }]);
      await getArchived(req, res, next);
      expect(res.json).toHaveBeenCalledWith([{ id: 1 }]);
    });

    it('passe l\'erreur à next', async () => {
      mockGetArchived.mockRejectedValue(new Error('DB error'));
      await getArchived(req, res, next);
      expect(next).toHaveBeenCalledWith(new Error('DB error'));
    });
  });
});
