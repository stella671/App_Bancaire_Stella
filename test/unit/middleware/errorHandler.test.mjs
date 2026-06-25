import { describe, it, expect, vi } from 'vitest';

const errorHandler = await import('../../../src/middleware/errorHandler.js');

function mockReqRes() {
  const req = {};
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();
  return { req, res, next };
}

describe('errorHandler', () => {
  it('retourne 400 pour JSON mal formé', () => {
    const { req, res, next } = mockReqRes();
    const err = { type: 'entity.parse.failed' };
    errorHandler.default(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('retourne le status de l\'erreur personnalisée', () => {
    const { req, res, next } = mockReqRes();
    const err = new Error('Solde insuffisant');
    err.status = 400;
    errorHandler.default(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('retourne 500 pour erreur inconnue', () => {
    const { req, res, next } = mockReqRes();
    errorHandler.default(new Error('Erreur'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('utilise les valeurs par défaut si name/message manquants', () => {
    const { req, res, next } = mockReqRes();
    errorHandler.default({ status: 500 }, req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      message: 'Une erreur interne s\'est produite',
    });
  });
});
