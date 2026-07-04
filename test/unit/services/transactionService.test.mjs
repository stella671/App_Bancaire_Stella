import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFindAll, mockFindById, mockUpdate, mockInsert } = vi.hoisted(() => ({
  mockFindAll: vi.fn(),
  mockFindById: vi.fn(),
  mockUpdate: vi.fn(),
  mockInsert: vi.fn(),
}));

vi.mock('../../../src/db.js', () => ({
  findAll: mockFindAll,
  findById: mockFindById,
  findBy: vi.fn(),
  insert: mockInsert,
  update: mockUpdate,
  remove: vi.fn(),
  getNextId: vi.fn(),
  reset: vi.fn(),
}));

const transactionService = await import('../../../src/services/transactionService.js');

const activeAccount = { id: 1, balance: 1000, status: 'ACTIVE' };
const inactiveAccount = { id: 2, balance: 1000, status: 'INACTIVE' };
const destAccount = { id: 3, balance: 500, status: 'ACTIVE' };

describe('transactionService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('deposit', () => {
    it('effectue un dépôt avec succès', async () => {
      mockFindById.mockImplementation((table, id) => {
        if (table === 'banks') return { id: 1, name: 'Test Bank' };
        if (id === 1) return activeAccount;
        return null;
      });
      mockInsert.mockReturnValue({ id: 1, amount: 200, type: 'DEPOSIT' });

      const result = await transactionService.deposit({ accountId: 1, amount: 200, bankId: 1, description: 'Dépôt test' }, { role: 'admin' });

      expect(mockUpdate).toHaveBeenCalledWith('accounts', 1, { balance: 1200 });
      expect(mockInsert).toHaveBeenCalled();
      expect(result.type).toBe('DEPOSIT');
    });

    it('rejette si le compte est introuvable', async () => {
      mockFindById.mockImplementation((table, id) => {
        if (table === 'banks') return { id: 1, name: 'Test Bank' };
        return null;
      });
      await expect(transactionService.deposit({ accountId: 999, amount: 100, bankId: 1 }, { role: 'admin' })).rejects.toThrow('introuvable');
    });

    it('rejette si le compte est inactif', async () => {
      mockFindById.mockImplementation((table, id) => {
        if (table === 'banks') return { id: 1, name: 'Test Bank' };
        if (id === 2) return inactiveAccount;
        return null;
      });
      await expect(transactionService.deposit({ accountId: 2, amount: 100, bankId: 1 }, { role: 'admin' })).rejects.toThrow('inactive');
    });
  });

  describe('withdraw', () => {
    it('effectue un retrait avec succès', async () => {
      mockFindById.mockReturnValue(activeAccount);
      mockInsert.mockReturnValue({ id: 1, amount: 100, type: 'WITHDRAWAL' });

      const result = await transactionService.withdraw({ accountId: 1, amount: 100 });

      expect(mockUpdate).toHaveBeenCalledWith('accounts', 1, { balance: 900 });
      expect(result.type).toBe('WITHDRAWAL');
    });

    it('rejette si solde insuffisant', async () => {
      mockFindById.mockReturnValue(activeAccount);
      await expect(transactionService.withdraw({ accountId: 1, amount: 9999 })).rejects.toThrow('Solde insuffisant');
    });

    it('rejette si compte introuvable', async () => {
      mockFindById.mockReturnValue(null);
      await expect(transactionService.withdraw({ accountId: 999, amount: 100 })).rejects.toThrow('introuvable');
    });
  });

  describe('transfer', () => {
    it('effectue un virement avec succès', async () => {
      mockFindById.mockImplementation((table, id) => {
        if (id === 1) return activeAccount;
        if (id === 3) return destAccount;
        return null;
      });
      mockInsert.mockReturnValue({ id: 1, amount: 300, type: 'TRANSFER' });

      const result = await transactionService.transfer({ sourceAccountId: 1, destinationAccountId: 3, amount: 300 });

      expect(mockUpdate).toHaveBeenCalledWith('accounts', 1, { balance: 700 });
      expect(mockUpdate).toHaveBeenCalledWith('accounts', 3, { balance: 800 });
      expect(result.type).toBe('TRANSFER');
    });

    it('rejette si solde insuffisant', async () => {
      mockFindById.mockImplementation((table, id) => {
        if (id === 1) return activeAccount;
        if (id === 3) return destAccount;
        return null;
      });
      await expect(transactionService.transfer({ sourceAccountId: 1, destinationAccountId: 3, amount: 9999 })).rejects.toThrow('Solde insuffisant');
    });

    it('rejette si destination inactive', async () => {
      mockFindById.mockImplementation((table, id) => {
        if (id === 1) return activeAccount;
        if (id === 2) return inactiveAccount;
        return null;
      });
      await expect(transactionService.transfer({ sourceAccountId: 1, destinationAccountId: 2, amount: 100 })).rejects.toThrow('inactive');
    });
  });

  describe('getAll', () => {
    it('retourne toutes les transactions pour admin', async () => {
      const transactions = [{ id: 1, amount: 100, type: 'DEPOSIT' }];
      mockFindAll.mockReturnValue(transactions);
      const result = await transactionService.getAll({ role: 'admin' });
      expect(result).toHaveLength(1);
      expect(mockFindAll).toHaveBeenCalledWith('transactions');
    });

    it('retourne les transactions liées à l\'utilisateur', async () => {
      mockFindAll.mockReturnValue([
        { id: 1, source_account_id: 1, destination_account_id: null },
        { id: 2, source_account_id: null, destination_account_id: 2 },
        { id: 3, source_account_id: 5, destination_account_id: null },
      ]);
      const mockFindBy = vi.fn().mockReturnValue([{ id: 1 }, { id: 2 }]);
      const db = await import('../../../src/db.js');
      db.findBy = mockFindBy;
      const result = await transactionService.getAll({ id: 1, role: 'user' });
      expect(result).toHaveLength(2);
    });
  });

  describe('getArchived', () => {
    it('retourne les transactions archivées', async () => {
      const archived = [{ id: 1, amount: 100, type: 'DEPOSIT' }];
      mockFindAll.mockReturnValue(archived);
      const result = await transactionService.getArchived();
      expect(result).toHaveLength(1);
      expect(mockFindAll).toHaveBeenCalledWith('archived_transactions');
    });
  });

  describe('getHistory', () => {
    it('retourne l\'historique', async () => {
      mockFindById.mockReturnValue({ id: 1 });
      const transactions = [
        { id: 1, amount: 100, type: 'DEPOSIT', source_account_id: null, destination_account_id: 1 },
        { id: 2, amount: 50, type: 'WITHDRAWAL', source_account_id: 1, destination_account_id: null },
      ];
      mockFindAll.mockReturnValue(transactions);

      const result = await transactionService.getHistory(1, { id: 1, role: 'admin' });
      expect(result).toHaveLength(2);
    });

    it('retourne l\'historique pour le propriétaire non-admin', async () => {
      mockFindById.mockReturnValue({ id: 1, user_id: 2 });
      const transactions = [
        { id: 1, amount: 100, type: 'DEPOSIT', source_account_id: null, destination_account_id: 1 },
      ];
      mockFindAll.mockReturnValue(transactions);

      const result = await transactionService.getHistory(1, { id: 2, role: 'user' });
      expect(result).toHaveLength(1);
    });

    it('rejette si non-admin et pas propriétaire', async () => {
      mockFindById.mockReturnValue({ id: 1, user_id: 2 });
      await expect(transactionService.getHistory(1, { id: 3, role: 'user' })).rejects.toThrow('introuvable');
    });

    it('rejette si compte introuvable', async () => {
      mockFindById.mockReturnValue(null);
      await expect(transactionService.getHistory(999, { id: 1, role: 'admin' })).rejects.toThrow('introuvable');
    });
  });
});
