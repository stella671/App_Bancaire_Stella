import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const { mockFindAll, mockFindById, mockFindBy, mockInsert, mockRemove } = vi.hoisted(() => ({
  mockFindAll: vi.fn(),
  mockFindById: vi.fn(),
  mockFindBy: vi.fn(),
  mockInsert: vi.fn(),
  mockRemove: vi.fn(),
}));

vi.mock('../../src/db.js', () => ({
  findAll: mockFindAll,
  findById: mockFindById,
  findBy: mockFindBy,
  insert: mockInsert,
  update: vi.fn(),
  remove: mockRemove,
  getNextId: vi.fn(),
  getTableConfig: vi.fn(() => ({ data: [] })),
  save: vi.fn(),
  reset: vi.fn(),
}));

vi.mock('../../src/middleware/auth.js', () => ({
  authenticate: (req, res, next) => { req.user = { id: 1, username: 'admin', role: 'admin' }; next(); },
  adminOnly: (req, res, next) => next(),
}));

const app = (await import('../../src/app.js')).default;

describe('Accounts API - Intégration', () => {
  beforeEach(() => { vi.resetAllMocks(); });

  it('POST /api/v1/accounts - crée un compte (201)', async () => {
    mockFindById.mockReturnValue({ id: 1, code: 'BNK' });
    mockInsert.mockReturnValue({ id: 1, account_number: 'BNK123', owner_name: 'John', owner_email: 'j@m.com', account_type: 'CHECKING', bank_id: 1 });
    const res = await request(app).post('/api/v1/accounts').send({ ownerName: 'John', ownerEmail: 'j@m.com', accountType: 'CHECKING', bankId: 1 });
    expect(res.status).toBe(201);
  });

  it('POST /api/v1/accounts - 404 si banque introuvable', async () => {
    mockFindById.mockReturnValue(null);
    const res = await request(app).post('/api/v1/accounts').send({ ownerName: 'John', ownerEmail: 'j@m.com', accountType: 'CHECKING', bankId: 999 });
    expect(res.status).toBe(404);
  });

  it('POST /api/v1/accounts - erreur serveur', async () => {
    mockFindById.mockImplementation(() => { throw new Error('DB error'); });
    const res = await request(app).post('/api/v1/accounts').send({ ownerName: 'John', ownerEmail: 'j@m.com', accountType: 'CHECKING', bankId: 1 });
    expect(res.status).toBe(500);
  });

  it('GET /api/v1/accounts - liste les comptes', async () => {
    mockFindAll.mockImplementation((table) => {
      if (table === 'accounts') return [{ id: 1, owner_name: 'John', bank_id: 1 }];
      if (table === 'banks') return [{ id: 1, name: 'Test' }];
      return [];
    });
    const res = await request(app).get('/api/v1/accounts');
    expect(res.status).toBe(200);
  });

  it('GET /api/v1/accounts/:id - retourne un compte', async () => {
    mockFindById.mockImplementation((table, id) => {
      if (table === 'accounts') return { id: 1, owner_name: 'John', bank_id: 1 };
      if (table === 'banks') return { id: 1, name: 'Test' };
      return null;
    });
    const res = await request(app).get('/api/v1/accounts/1');
    expect(res.status).toBe(200);
  });

  it('GET /api/v1/accounts/:id - 404 si introuvable', async () => {
    mockFindById.mockReturnValue(null);
    const res = await request(app).get('/api/v1/accounts/999');
    expect(res.status).toBe(404);
  });

  it('GET /api/v1/accounts/bank/:bankId - comptes par banque', async () => {
    mockFindById.mockReturnValue({ id: 1, name: 'Test' });
    mockFindBy.mockReturnValue([{ id: 1, owner_name: 'John', bank_id: 1 }]);
    const res = await request(app).get('/api/v1/accounts/bank/1');
    expect(res.status).toBe(200);
  });

  it('GET /api/v1/accounts/bank/:bankId - 404 si banque introuvable', async () => {
    mockFindById.mockReturnValue(null);
    const res = await request(app).get('/api/v1/accounts/bank/999');
    expect(res.status).toBe(404);
  });

  it('GET /api/v1/accounts - erreur serveur', async () => {
    mockFindAll.mockImplementation(() => { throw new Error('DB error'); });
    const res = await request(app).get('/api/v1/accounts');
    expect(res.status).toBe(500);
  });

  it('GET /api/v1/accounts/:id - erreur serveur', async () => {
    mockFindById.mockImplementation(() => { throw new Error('DB error'); });
    const res = await request(app).get('/api/v1/accounts/1');
    expect(res.status).toBe(500);
  });

  it('GET /api/v1/accounts/bank/:bankId - erreur serveur', async () => {
    mockFindById.mockImplementation(() => { throw new Error('DB error'); });
    const res = await request(app).get('/api/v1/accounts/bank/1');
    expect(res.status).toBe(500);
  });

  it('DELETE /api/v1/accounts/:id - supprime (204)', async () => {
    mockFindById.mockImplementation((table, id) => {
      if (table === 'accounts') return { id: 1, owner_name: 'John', bank_id: 1, user_id: 1, balance: 0 };
      if (table === 'banks') return { id: 1, name: 'Test' };
      return null;
    });
    mockFindAll.mockReturnValue([]);
    mockRemove.mockReturnValue(true);
    const res = await request(app).delete('/api/v1/accounts/1');
    expect(res.status).toBe(204);
  });

  it('DELETE /api/v1/accounts/:id - 404 si introuvable', async () => {
    mockFindById.mockImplementation((table, id) => {
      if (table === 'accounts') return undefined;
      return null;
    });
    mockRemove.mockReturnValue(false);
    const res = await request(app).delete('/api/v1/accounts/999');
    expect(res.status).toBe(404);
  });

  it('DELETE /api/v1/accounts/:id - erreur serveur', async () => {
    mockFindById.mockImplementation((table, id) => {
      if (table === 'accounts') return { id: 1, owner_name: 'John', bank_id: 1, user_id: 1, balance: 0 };
      if (table === 'banks') return { id: 1, name: 'Test' };
      return null;
    });
    mockFindAll.mockReturnValue([]);
    mockRemove.mockImplementation(() => { throw new Error('DB error'); });
    const res = await request(app).delete('/api/v1/accounts/1');
    expect(res.status).toBe(500);
  });
});
