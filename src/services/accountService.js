import * as db from '../db.js';

function generateAccountNumber(bankCode) {
  const rand = Math.random().toString().slice(2, 12);
  return `${bankCode}${rand}`;
}

export async function create(data, userId) {
  const { ownerName, ownerEmail, accountType, bankId } = data;

  const bank = db.findById('banks', bankId);
  if (!bank) return null;

  const accountNumber = generateAccountNumber(bank.code);
  return db.insert('accounts', {
    account_number: accountNumber,
    owner_name: ownerName,
    owner_email: ownerEmail,
    account_type: accountType,
    balance: 0,
    status: 'ACTIVE',
    bank_id: Number(bankId),
    user_id: userId || null,
  });
}

export async function getAll(user) {
  let accounts;
  if (user.role === 'admin') {
    accounts = db.findAll('accounts');
  } else {
    accounts = db.findBy('accounts', 'user_id', user.id);
  }
  const banks = db.findAll('banks');
  return accounts.map((a) => {
    const bank = banks.find((b) => b.id === Number(a.bank_id));
    return { ...a, bank_name: bank ? bank.name : null };
  });
}

export async function getById(id, user) {
  const account = db.findById('accounts', id);
  if (!account) return null;
  if (user.role !== 'admin' && Number(account.user_id) !== user.id) return null;
  const bank = db.findById('banks', account.bank_id);
  return { ...account, bank_name: bank ? bank.name : null };
}

export async function getByBank(bankId, user) {
  const bank = db.findById('banks', bankId);
  if (!bank) return null;

  let accounts;
  if (user.role === 'admin') {
    accounts = db.findBy('accounts', 'bank_id', bankId);
  } else {
    accounts = db.findBy('accounts', 'bank_id', bankId).filter((a) => Number(a.user_id) === user.id);
  }
  return accounts.map((a) => ({ ...a, bank_name: bank.name }));
}

class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function archiveRelatedTransactions(accountId) {
  const all = db.findAll('transactions');
  const related = all.filter(
    (t) => t.source_account_id == accountId || t.destination_account_id == accountId
  );
  if (related.length === 0) return;

  for (const tx of related) {
    db.insert('archived_transactions', tx);
  }

  const remaining = all.filter(
    (t) => t.source_account_id != accountId && t.destination_account_id != accountId
  );
  const config = db.getTableConfig('transactions');
  config.data = remaining;
  db.save('transactions');
}

export async function remove(id) {
  const account = db.findById('accounts', id);
  if (!account) return false;

  if (Number(account.balance) !== 0) {
    throw new AppError(
      'Impossible de supprimer un compte dont le solde n\'est pas nul. Veuillez d\'abord vider le compte.',
      400
    );
  }

  archiveRelatedTransactions(id);
  return db.remove('accounts', id);
}

export async function update(id, data, user) {
  const account = db.findById('accounts', id);
  if (!account) return null;

  if (user.role !== 'admin' && Number(account.user_id) !== user.id) {
    throw new AppError('Vous ne pouvez modifier que vos propres comptes', 403);
  }

  const allowed = {};
  if (data.owner_name !== undefined) allowed.owner_name = data.owner_name;
  if (data.owner_email !== undefined) allowed.owner_email = data.owner_email;
  if (data.account_type !== undefined) allowed.account_type = data.account_type;
  if (data.status !== undefined && user.role === 'admin') allowed.status = data.status;

  return db.update('accounts', id, allowed);
}

export async function exists(id) {
  return db.findById('accounts', id) !== null;
}
