import * as bankService from '../services/bankService.js';

export async function create(req, res, next) {
  try {
    const bank = await bankService.create(req.body);
    res.status(201).json(bank);
  } catch (err) {
    next(err);
  }
}

export async function getAll(req, res, next) {
  try {
    const banks = await bankService.getAll();
    res.json(banks);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const bank = await bankService.getById(req.params.id);
    if (!bank) {
      return res.status(404).json({ error: 'Not Found', message: `Banque ${req.params.id} introuvable` });
    }
    res.json(bank);
  } catch (err) {
    next(err);
  }
}
