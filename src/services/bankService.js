import * as db from '../db.js';

class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function create(data) {
  const { name, code, address, country } = data;

  const existingName = db.findBy('banks', 'name', name);
  if (existingName.length > 0) {
    throw new AppError('Une banque avec ce nom existe déjà', 409);
  }

  const existingCode = db.findBy('banks', 'code', code);
  if (existingCode.length > 0) {
    throw new AppError('Une banque avec ce code existe déjà', 409);
  }

  return db.insert('banks', { name, code, address, country });
}

export async function getAll() {
  const banks = db.findAll('banks');
  const accounts = db.findAll('accounts');
  return banks.map((b) => ({
    ...b,
    account_count: accounts.filter((a) => Number(a.bank_id) === b.id).length,
  }));
}

export async function getById(id) {
  const bank = db.findById('banks', id);
  if (!bank) return null;
  const accounts = db.findAll('accounts');
  return {
    ...bank,
    account_count: accounts.filter((a) => Number(a.bank_id) === bank.id).length,
  };
}
