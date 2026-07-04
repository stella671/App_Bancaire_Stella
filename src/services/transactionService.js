import * as db from '../db.js';

class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function findAccount(id) {
  const account = db.findById('accounts', id);
  if (!account) {
    throw new AppError(`Compte ${id} introuvable`, 404);
  }
  return account;
}

function validateActive(account) {
  if (account.status !== 'ACTIVE') {
    throw new AppError(
      `Le compte est ${account.status.toLowerCase()} et ne peut pas effectuer d'opérations`,
      400
    );
  }
}

export async function deposit(data, user) {
  const { accountId, amount, description, bankId } = data;
  if (!bankId) {
    throw new AppError('La banque source est requise pour un dépôt', 400);
  }

  const bank = db.findById('banks', bankId);
  if (!bank) {
    throw new AppError(`Banque ${bankId} introuvable`, 404);
  }

  const account = findAccount(accountId);
  validateActive(account);

  const newBalance = Number.parseFloat(account.balance) + Number.parseFloat(amount);
  db.update('accounts', accountId, { balance: newBalance });

  return db.insert('transactions', {
    amount: Number.parseFloat(amount),
    fee: 0,
    type: 'DEPOSIT',
    description: description || `Dépôt à ${bank.name}`,
    source_account_id: null,
    destination_account_id: accountId,
    bank_id: Number(bankId),
  });
}

export async function withdraw(data) {
  const { accountId, amount, description } = data;
  const account = findAccount(accountId);
  validateActive(account);

  if (Number.parseFloat(account.balance) < Number.parseFloat(amount)) {
    throw new AppError('Solde insuffisant pour effectuer le retrait', 400);
  }

  const newBalance = Number.parseFloat(account.balance) - Number.parseFloat(amount);
  db.update('accounts', accountId, { balance: newBalance });

  return db.insert('transactions', {
    amount: Number.parseFloat(amount),
    fee: 0,
    type: 'WITHDRAWAL',
    description: description || null,
    source_account_id: accountId,
    destination_account_id: null,
  });
}

export async function transfer(data) {
  const sourceAccountId = data.sourceAccountId || data.fromAccountId;
  const destinationAccountId = data.destinationAccountId || data.toAccountId;
  const { amount, description } = data;
  const source = findAccount(sourceAccountId);
  const destination = findAccount(destinationAccountId);

  validateActive(source);
  validateActive(destination);

  if (Number.parseFloat(source.balance) < Number.parseFloat(amount)) {
    throw new AppError('Solde insuffisant pour effectuer le virement', 400);
  }

  const newSourceBalance = Number.parseFloat(source.balance) - Number.parseFloat(amount);
  const newDestBalance = Number.parseFloat(destination.balance) + Number.parseFloat(amount);

  db.update('accounts', sourceAccountId, { balance: newSourceBalance });
  db.update('accounts', destinationAccountId, { balance: newDestBalance });

  return db.insert('transactions', {
    amount: Number.parseFloat(amount),
    fee: 0,
    type: 'TRANSFER',
    description: description || null,
    source_account_id: sourceAccountId,
    destination_account_id: destinationAccountId,
  });
}

export async function getAll(user) {
  const all = db.findAll('transactions');
  if (user.role === 'admin') return all;

  const userAccounts = db.findBy('accounts', 'user_id', user.id);
  const userAccountIds = userAccounts.map((a) => a.id);

  return all.filter(
    (t) =>
      userAccountIds.includes(t.source_account_id) ||
      userAccountIds.includes(t.destination_account_id)
  );
}

export async function getArchived() {
  return db.findAll('archived_transactions');
}

export async function getHistory(accountId, user) {
  const account = db.findById('accounts', accountId);
  if (!account) {
    throw new AppError(`Compte ${accountId} introuvable`, 404);
  }
  if (user.role !== 'admin' && Number(account.user_id) !== user.id) {
    throw new AppError(`Compte ${accountId} introuvable`, 404);
  }

  const all = db.findAll('transactions');
  return all
    .filter((t) => t.source_account_id === accountId || t.destination_account_id === accountId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}
