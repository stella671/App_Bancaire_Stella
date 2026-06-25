import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

const { mockFindBy, mockFindAll, mockFindById, mockInsert } = vi.hoisted(() => ({
  mockFindBy: vi.fn(),
  mockFindAll: vi.fn(),
  mockFindById: vi.fn(),
  mockInsert: vi.fn(),
}));

vi.mock('../../src/db.js', () => ({
  findAll: mockFindAll,
  findById: mockFindById,
  findBy: mockFindBy,
  insert: mockInsert,
  update: vi.fn(),
  remove: vi.fn(),
  getNextId: vi.fn(),
  reset: vi.fn(),
}));

vi.mock('../../src/middleware/auth.js', () => ({
  authenticate: (req, res, next) => { req.user = { id: 1, username: 'admin', role: 'admin' }; next(); },
  adminOnly: (req, res, next) => next(),
}));

const app = (await import('../../src/app.js')).default;

describe('Banks API - Intégration', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('POST /api/v1/banks - crée une banque (201)', async () => {
    mockFindBy.mockReturnValue([]);
    mockInsert.mockReturnValue({ id: 1, name: 'Test Bank', code: 'TST', address: null, country: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    const res = await request(app).post('/api/v1/banks').send({ name: 'Test Bank', code: 'TST' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Bank');
  });

  it('POST /api/v1/banks - retourne 409 si code en double', async () => {
    mockFindBy.mockImplementation((table, field) => {
      if (field === 'code') return [{ id: 1 }];
      return [];
    });
    const res = await request(app).post('/api/v1/banks').send({ name: 'Test', code: 'TST' });
    expect(res.status).toBe(409);
  });

  it('GET /api/v1/banks - liste les banques', async () => {
    mockFindAll.mockImplementation((table) => {
      if (table === 'banks') return [{ id: 1, name: 'Test', code: 'TST' }];
      if (table === 'accounts') return [];
      return [];
    });
    const res = await request(app).get('/api/v1/banks');
    expect(res.status).toBe(200);
  });

  it('GET /api/v1/banks/:id - retourne une banque', async () => {
    mockFindById.mockReturnValue({ id: 1, name: 'Test', code: 'TST' });
    mockFindAll.mockReturnValue([]);
    const res = await request(app).get('/api/v1/banks/1');
    expect(res.status).toBe(200);
  });

  it('GET /api/v1/banks/:id - 404 si introuvable', async () => {
    mockFindById.mockReturnValue(null);
    const res = await request(app).get('/api/v1/banks/999');
    expect(res.status).toBe(404);
  });

  it('GET /api/v1/banks - erreur serveur', async () => {
    mockFindAll.mockImplementation(() => { throw new Error('DB error'); });
    const res = await request(app).get('/api/v1/banks');
    expect(res.status).toBe(500);
  });

  it('GET /api/v1/banks/:id - erreur serveur', async () => {
    mockFindById.mockImplementation(() => { throw new Error('DB error'); });
    const res = await request(app).get('/api/v1/banks/1');
    expect(res.status).toBe(500);
  });
});
