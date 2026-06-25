import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFindBy, mockFindAll, mockFindById, mockInsert, mockRemove } = vi.hoisted(() => ({
  mockFindBy: vi.fn(),
  mockFindAll: vi.fn(),
  mockFindById: vi.fn(),
  mockInsert: vi.fn(),
  mockRemove: vi.fn(),
}));

vi.mock('../../../src/db.js', () => ({
  findAll: mockFindAll,
  findById: mockFindById,
  findBy: mockFindBy,
  insert: mockInsert,
  update: vi.fn(),
  remove: mockRemove,
  getNextId: vi.fn(),
  reset: vi.fn(),
}));

const bankService = await import('../../../src/services/bankService.js');

describe('bankService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('create', () => {
    it('crée une banque et retourne le résultat', async () => {
      mockFindBy.mockReturnValue([]);
      const fakeBank = { id: 1, name: 'Test Bank', code: 'TST', address: 'Addr', country: 'CM' };
      mockInsert.mockReturnValue(fakeBank);

      const result = await bankService.create({ name: 'Test Bank', code: 'TST', address: 'Addr', country: 'CM' });

      expect(mockFindBy).toHaveBeenCalledWith('banks', 'name', 'Test Bank');
      expect(mockFindBy).toHaveBeenCalledWith('banks', 'code', 'TST');
      expect(mockInsert).toHaveBeenCalledWith('banks', { name: 'Test Bank', code: 'TST', address: 'Addr', country: 'CM' });
      expect(result).toEqual(fakeBank);
    });

    it('rejette si le nom existe déjà', async () => {
      mockFindBy.mockImplementation((table, field) => {
        if (field === 'name') return [{ id: 1, name: 'Test Bank' }];
        return [];
      });
      await expect(bankService.create({ name: 'Test Bank', code: 'TST' })).rejects.toThrow('nom existe déjà');
    });

    it('rejette si le code existe déjà', async () => {
      mockFindBy.mockImplementation((table, field) => {
        if (field === 'code') return [{ id: 1, code: 'TST' }];
        return [];
      });
      await expect(bankService.create({ name: 'New Bank', code: 'TST' })).rejects.toThrow('code existe déjà');
    });
  });

  describe('getAll', () => {
    it('retourne la liste des banques avec account_count', async () => {
      const banks = [
        { id: 1, name: 'Bank A', code: 'A' },
        { id: 2, name: 'Bank B', code: 'B' },
      ];
      const accounts = [
        { id: 1, bank_id: 1 },
        { id: 2, bank_id: 1 },
        { id: 3, bank_id: 2 },
      ];
      mockFindAll.mockImplementation((table) => {
        if (table === 'banks') return banks;
        if (table === 'accounts') return accounts;
        return [];
      });

      const result = await bankService.getAll();

      expect(result).toHaveLength(2);
      expect(result[0].account_count).toBe(2);
      expect(result[1].account_count).toBe(1);
    });
  });

  describe('getById', () => {
    it('retourne la banque si trouvée', async () => {
      const bank = { id: 1, name: 'Test', code: 'TST' };
      mockFindById.mockReturnValue(bank);
      mockFindAll.mockReturnValue([{ id: 1, bank_id: 1 }]);

      const result = await bankService.getById(1);
      expect(result).toEqual({ ...bank, account_count: 1 });
    });

    it('retourne null si introuvable', async () => {
      mockFindById.mockReturnValue(null);
      expect(await bankService.getById(999)).toBeNull();
    });
  });
});
