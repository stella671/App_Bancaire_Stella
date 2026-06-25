import * as transactionService from '../services/transactionService.js';

export async function deposit(req, res, next) {
  try {
    const result = await transactionService.deposit(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function withdraw(req, res, next) {
  try {
    const result = await transactionService.withdraw(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function transfer(req, res, next) {
  try {
    const result = await transactionService.transfer(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function getAll(req, res, next) {
  try {
    const transactions = await transactionService.getAll();
    res.json(transactions);
  } catch (err) {
    next(err);
  }
}

export async function getHistory(req, res, next) {
  try {
    const transactions = await transactionService.getHistory(req.params.accountId, req.user);
    res.json(transactions);
  } catch (err) {
    next(err);
  }
}

export async function getArchived(req, res, next) {
  try {
    const transactions = await transactionService.getArchived();
    res.json(transactions);
  } catch (err) {
    next(err);
  }
}
