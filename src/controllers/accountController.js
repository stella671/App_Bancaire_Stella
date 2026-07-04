import * as db from '../db.js';
import * as accountService from '../services/accountService.js';

export async function create(req, res, next) {
  try {
    const userId = req.user.role === 'admin' ? req.body.userId || null : req.user.id;
    const account = await accountService.create(req.body, userId);
    if (!account) {
      return res.status(404).json({ error: 'Not Found', message: `Banque ${req.body.bankId} introuvable` });
    }
    res.status(201).json(account);
  } catch (err) {
    next(err);
  }
}

export async function getAll(req, res, next) {
  try {
    const accounts = await accountService.getAll(req.user);
    res.json(accounts);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const account = await accountService.getById(req.params.id, req.user);
    if (!account) {
      return res.status(404).json({ error: 'Not Found', message: `Compte ${req.params.id} introuvable` });
    }
    res.json(account);
  } catch (err) {
    next(err);
  }
}

export async function getByBank(req, res, next) {
  try {
    const accounts = await accountService.getByBank(req.params.bankId, req.user);
    if (accounts === null) {
      return res.status(404).json({ error: 'Not Found', message: `Banque ${req.params.bankId} introuvable` });
    }
    res.json(accounts);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const account = await accountService.getById(req.params.id, req.user);
    if (!account) {
      return res.status(404).json({ error: 'Not Found', message: `Compte ${req.params.id} introuvable` });
    }
    if (req.user.role !== 'admin' && Number(account.user_id) !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden', message: 'Vous ne pouvez supprimer que vos propres comptes' });
    }
    await accountService.remove(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const data = {};
    if (req.body.ownerName !== undefined) data.owner_name = req.body.ownerName;
    if (req.body.ownerEmail !== undefined) data.owner_email = req.body.ownerEmail;
    if (req.body.accountType !== undefined) data.account_type = req.body.accountType;
    if (req.body.status !== undefined) data.status = req.body.status;

    const account = await accountService.update(req.params.id, data, req.user);
    if (!account) {
      return res.status(404).json({ error: 'Not Found', message: `Compte ${req.params.id} introuvable` });
    }
    const bank = await db.findById('banks', account.bank_id);
    res.json({ ...account, bank_name: bank ? bank.name : null });
  } catch (err) {
    next(err);
  }
}
