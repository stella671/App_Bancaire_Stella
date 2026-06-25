import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFindAll, mockFindById, mockFindBy, mockInsert, mockUpdate, mockSave, mockRemove } = vi.hoisted(() => ({
  mockFindAll: vi.fn(),
  mockFindById: vi.fn(),
  mockFindBy: vi.fn(),
  mockInsert: vi.fn(),
  mockUpdate: vi.fn(),
  mockSave: vi.fn(),
  mockRemove: vi.fn(),
}));

vi.mock('../../../src/db.js', () => ({
  findAll: mockFindAll,
  findById: mockFindById,
  findBy: mockFindBy,
  insert: mockInsert,
  update: mockUpdate,
  remove: mockRemove,
  getNextId: vi.fn(),
  getTableConfig: vi.fn(() => ({ data: [] })),
  save: mockSave,
  reset: vi.fn(),
}));

const accountService = await import('../../../src/services/accountService.js');

describe('accountService', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('create', () => {
    it('crée un compte avec un numéro généré', async () => {
      mockFindById.mockReturnValue({ id: 1, code: 'BNK' });
      const fakeAccount = { id: 1, account_number: 'BNK1234567890', owner_name: 'John', owner_email: 'j@m.com', account_type: 'CHECKING', bank_id: 1 };
      mockInsert.mockReturnValue(fakeAccount);

      const result = await accountService.create({ ownerName: 'John', ownerEmail: 'j@m.com', accountType: 'CHECKING', bankId: 1 });

      expect(mockFindById).toHaveBeenCalledWith('banks', 1);
      expect(mockInsert).toHaveBeenCalled();
      expect(result.account_number).toMatch(/^BNK\d{10}$/);
    });

    it('retourne null si la banque est introuvable', async () => {
      mockFindById.mockReturnValue(null);
      expect(await accountService.create({ ownerName: 'John', ownerEmail: 'j@m.com', accountType: 'CHECKING', bankId: 999 })).toBeNull();
    });
  });

  describe('getAll', () => {
    it('retourne tous les comptes avec bank_name pour admin', async () => {
      const accounts = [{ id: 1, owner_name: 'John', bank_id: 1 }];
      const banks = [{ id: 1, name: 'Test Bank' }];
      mockFindAll.mockImplementation((table) => {
        if (table === 'accounts') return accounts;
        if (table === 'banks') return banks;
        return [];
      });

      const result = await accountService.getAll({ role: 'admin' });
      expect(result).toHaveLength(1);
      expect(result[0].bank_name).toBe('Test Bank');
    });

    it('filtre par user_id pour non-admin', async () => {
      const accounts = [
        { id: 1, owner_name: 'John', bank_id: 1, user_id: 2 },
        { id: 2, owner_name: 'Jane', bank_id: 1, user_id: 3 },
      ];
      const banks = [{ id: 1, name: 'Test Bank' }];
      mockFindBy.mockReturnValue([accounts[0]]);
      mockFindAll.mockImplementation((table) => {
        if (table === 'banks') return banks;
        return [];
      });

      const result = await accountService.getAll({ id: 2, role: 'user' });
      expect(result).toHaveLength(1);
      expect(result[0].owner_name).toBe('John');
    });

    it('retourne null bank_name si la banque est introuvable', async () => {
      const accounts = [{ id: 1, owner_name: 'John', bank_id: 999 }];
      const banks = [{ id: 1, name: 'Test Bank' }];
      mockFindAll.mockImplementation((table) => {
        if (table === 'accounts') return accounts;
        if (table === 'banks') return banks;
        return [];
      });

      const result = await accountService.getAll({ role: 'admin' });
      expect(result[0].bank_name).toBeNull();
    });
  });

  describe('getById', () => {
    it('retourne le compte si trouvé par admin', async () => {
      mockFindById.mockImplementation((table, id) => {
        if (table === 'accounts') return { id: 1, owner_name: 'John', bank_id: 1 };
        if (table === 'banks') return { id: 1, name: 'Test' };
        return null;
      });
      expect(await accountService.getById(1, { role: 'admin' })).toBeTruthy();
    });

    it('retourne le compte si propriétaire non-admin', async () => {
      mockFindById.mockImplementation((table, id) => {
        if (table === 'accounts') return { id: 1, owner_name: 'John', bank_id: 1, user_id: 2 };
        if (table === 'banks') return { id: 1, name: 'Test' };
        return null;
      });
      expect(await accountService.getById(1, { id: 2, role: 'user' })).toBeTruthy();
    });

    it('retourne null si non-admin et pas propriétaire', async () => {
      mockFindById.mockImplementation((table, id) => {
        if (table === 'accounts') return { id: 1, owner_name: 'John', bank_id: 1, user_id: 2 };
        return null;
      });
      expect(await accountService.getById(1, { id: 3, role: 'user' })).toBeNull();
    });

    it('retourne null bank_name si la banque est introuvable', async () => {
      mockFindById.mockImplementation((table, id) => {
        if (table === 'accounts') return { id: 1, owner_name: 'John', bank_id: 999 };
        if (table === 'banks') return null;
        return null;
      });
      const result = await accountService.getById(1, { role: 'admin' });
      expect(result.bank_name).toBeNull();
    });

    it('retourne null si introuvable', async () => {
      mockFindById.mockReturnValue(null);
      expect(await accountService.getById(999, { role: 'admin' })).toBeNull();
    });
  });

  describe('getByBank', () => {
    it('retourne les comptes d\'une banque', async () => {
      const bank = { id: 1, name: 'Test' };
      mockFindById.mockReturnValue(bank);
      mockFindBy.mockReturnValue([{ id: 1, owner_name: 'John', bank_id: 1 }]);

      const result = await accountService.getByBank(1, { role: 'admin' });
      expect(result).toHaveLength(1);
      expect(result[0].bank_name).toBe('Test');
    });

    it('retourne null si banque introuvable', async () => {
      mockFindById.mockReturnValue(null);
      expect(await accountService.getByBank(999, { role: 'admin' })).toBeNull();
    });

    it('filtre par user_id pour non-admin', async () => {
      mockFindById.mockReturnValue({ id: 1, name: 'Test' });
      mockFindBy.mockReturnValue([
        { id: 1, owner_name: 'John', bank_id: 1, user_id: 2 },
        { id: 2, owner_name: 'Jane', bank_id: 1, user_id: 3 },
      ]);
      const result = await accountService.getByBank(1, { id: 2, role: 'user' });
      expect(result).toHaveLength(1);
      expect(result[0].owner_name).toBe('John');
    });
  });

  describe('remove', () => {
    it('retourne true si supprimé', async () => {
      mockFindById.mockReturnValue({ id: 1, balance: 0 });
      mockFindAll.mockReturnValue([]);
      mockRemove.mockReturnValue(true);
      expect(await accountService.remove(1)).toBe(true);
    });

    it('archive les transactions liées avant suppression', async () => {
      const relatedTx = { id: 1, amount: 100, source_account_id: 1, destination_account_id: null };
      mockFindById.mockReturnValue({ id: 1, balance: 0 });
      mockFindAll.mockReturnValue([relatedTx]);
      mockRemove.mockReturnValue(true);

      expect(await accountService.remove(1)).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith('archived_transactions', relatedTx);
      expect(mockSave).toHaveBeenCalledWith('transactions');
    });

    it('archive les transactions où le compte est la destination', async () => {
      const srcTx = { id: 1, source_account_id: 2, destination_account_id: 1 };
      const unrelTx = { id: 2, source_account_id: 2, destination_account_id: 3 };
      mockFindById.mockReturnValue({ id: 1, balance: 0 });
      mockFindAll.mockReturnValue([srcTx, unrelTx]);
      mockInsert.mockReturnValue({});
      mockRemove.mockReturnValue(true);

      expect(await accountService.remove(1)).toBe(true);
      expect(mockInsert).toHaveBeenCalledWith('archived_transactions', srcTx);
      expect(mockInsert).not.toHaveBeenCalledWith('archived_transactions', unrelTx);
    });

    it('retourne false si solde non nul', async () => {
      mockFindById.mockReturnValue({ id: 1, balance: 500 });
      await expect(accountService.remove(1)).rejects.toThrow('solde');
    });

    it('retourne false si introuvable', async () => {
      mockFindById.mockReturnValue(null);
      mockRemove.mockReturnValue(false);
      expect(await accountService.remove(999)).toBe(false);
    });
  });

  describe('update', () => {
    it('modifie un compte par admin', async () => {
      mockFindById.mockReturnValue({ id: 1, user_id: 2, balance: 0 });
      mockUpdate.mockReturnValue({ id: 1, owner_name: 'NewName' });
      const result = await accountService.update(1, { owner_name: 'NewName', owner_email: 'new@mail.com', account_type: 'SAVINGS' }, { role: 'admin' });
      expect(mockUpdate).toHaveBeenCalled();
      expect(result.owner_name).toBe('NewName');
    });

    it('modifie le statut seulement par admin', async () => {
      mockFindById.mockReturnValue({ id: 1, user_id: 2, balance: 0 });
      mockUpdate.mockReturnValue({ id: 1, status: 'SUSPENDED' });
      const result = await accountService.update(1, { owner_name: 'John', status: 'SUSPENDED' }, { role: 'admin' });
      expect(mockUpdate).toHaveBeenCalledWith('accounts', 1, { owner_name: 'John', status: 'SUSPENDED' });
    });

    it('ignore le statut si non-admin', async () => {
      mockFindById.mockReturnValue({ id: 1, user_id: 2, balance: 0 });
      mockUpdate.mockReturnValue({ id: 1 });
      await accountService.update(1, { owner_name: 'John', status: 'SUSPENDED' }, { id: 2, role: 'user' });
      expect(mockUpdate).toHaveBeenCalledWith('accounts', 1, { owner_name: 'John' });
    });

    it('retourne null si introuvable', async () => {
      mockFindById.mockReturnValue(null);
      expect(await accountService.update(999, { owner_name: 'John' }, { role: 'admin' })).toBeNull();
    });

    it('rejette si non-admin et pas propriétaire', async () => {
      mockFindById.mockReturnValue({ id: 1, user_id: 2, balance: 0 });
      await expect(accountService.update(1, { owner_name: 'John' }, { id: 3, role: 'user' })).rejects.toThrow('modifier');
    });
  });

  describe('exists', () => {
    it('retourne true si le compte existe', async () => {
      mockFindById.mockReturnValue({ id: 1 });
      expect(await accountService.exists(1)).toBe(true);
    });

    it('retourne false si le compte n\'existe pas', async () => {
      mockFindById.mockReturnValue(null);
      expect(await accountService.exists(999)).toBe(false);
    });
  });
});
