import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const { mockFindAll, mockFindById, mockUpdate, mockInsert } = vi.hoisted(() => ({
  mockFindAll: vi.fn(),
  mockFindById: vi.fn(),
  mockUpdate: vi.fn(),
  mockInsert: vi.fn(),
}));

vi.mock('../../src/db.js', () => ({
  findAll: mockFindAll,
  findById: mockFindById,
  findBy: vi.fn(),
  insert: mockInsert,
  update: mockUpdate,
  remove: vi.fn(),
  getNextId: vi.fn(),
  reset: vi.fn(),
}));

vi.mock('../../src/middleware/auth.js', () => ({
  authenticate: (req, res, next) => { req.user = { id: 1, username: 'admin', role: 'admin' }; next(); },
  adminOnly: (req, res, next) => next(),
}));

const app = (await import('../../src/app.js')).default;

describe('Transactions API - Intégration', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('POST /api/v1/transactions/deposit - dépôt (201)', async () => {
    mockFindById.mockImplementation((table, id) => {
      if (table === 'banks') return { id: 1, name: 'Test Bank' };
      return { id: 1, balance: 500, status: 'ACTIVE' };
    });
    mockInsert.mockReturnValue({ id: 1, amount: 200, type: 'DEPOSIT' });

    const res = await request(app).post('/api/v1/transactions/deposit').send({ accountId: 1, amount: 200, bankId: 1 });
    expect(res.status).toBe(201);
    expect(res.body.type).toBe('DEPOSIT');
  });

  it('POST /api/v1/transactions/deposit - 404 si compte introuvable', async () => {
    mockFindById.mockImplementation((table, id) => {
      if (table === 'banks') return { id: 1, name: 'Test Bank' };
      return null;
    });
    const res = await request(app).post('/api/v1/transactions/deposit').send({ accountId: 999, amount: 100, bankId: 1 });
    expect(res.status).toBe(404);
  });

  it('POST /api/v1/transactions/withdraw - retrait (201)', async () => {
    mockFindById.mockReturnValue({ id: 1, balance: 1000, status: 'ACTIVE' });
    mockInsert.mockReturnValue({ id: 1, amount: 100, type: 'WITHDRAWAL' });

    const res = await request(app).post('/api/v1/transactions/withdraw').send({ accountId: 1, amount: 100 });
    expect(res.status).toBe(201);
  });

  it('POST /api/v1/transactions/withdraw - 400 si solde insuffisant', async () => {
    mockFindById.mockReturnValue({ id: 1, balance: 50, status: 'ACTIVE' });
    const res = await request(app).post('/api/v1/transactions/withdraw').send({ accountId: 1, amount: 9999 });
    expect(res.status).toBe(400);
  });

  it('POST /api/v1/transactions/transfer - virement (201)', async () => {
    mockFindById.mockImplementation((table, id) => {
      if (id === 1) return { id: 1, balance: 1000, status: 'ACTIVE' };
      if (id === 2) return { id: 2, balance: 500, status: 'ACTIVE' };
      return null;
    });
    mockInsert.mockReturnValue({ id: 1, amount: 300, type: 'TRANSFER' });

    const res = await request(app).post('/api/v1/transactions/transfer').send({ sourceAccountId: 1, destinationAccountId: 2, amount: 300 });
    expect(res.status).toBe(201);
  });

  it('POST /api/v1/transactions/transfer - 400 si solde insuffisant', async () => {
    mockFindById.mockImplementation((table, id) => {
      if (id === 1) return { id: 1, balance: 50, status: 'ACTIVE' };
      if (id === 2) return { id: 2, balance: 500, status: 'ACTIVE' };
      return null;
    });

    const res = await request(app).post('/api/v1/transactions/transfer').send({ sourceAccountId: 1, destinationAccountId: 2, amount: 9999 });
    expect(res.status).toBe(400);
  });

  it('GET /api/v1/transactions/account/:accountId - historique', async () => {
    mockFindById.mockReturnValue({ id: 1 });
    mockFindAll.mockReturnValue([{ id: 1, amount: 100, type: 'DEPOSIT', source_account_id: null, destination_account_id: 1 }]);
    const res = await request(app).get('/api/v1/transactions/account/1');
    expect(res.status).toBe(200);
  });

  it('GET /api/v1/transactions/account/:accountId - erreur serveur', async () => {
    mockFindById.mockImplementation(() => { throw new Error('DB error'); });
    const res = await request(app).get('/api/v1/transactions/account/1');
    expect(res.status).toBe(500);
  });
});
