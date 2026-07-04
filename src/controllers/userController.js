import * as db from '../db.js';

export async function getAll(req, res, next) {
  try {
    const users = await db.findAll('users');
    res.json(users.map(({ password, ...u }) => u));
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Validation', message: 'username et password requis' });
    }

    const existing = await db.findBy('users', 'username', username);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Conflict', message: 'Ce nom d\'utilisateur existe déjà' });
    }

    const user = await db.insert('users', { username, password, role: role || 'user' });
    const { password: pwd, ...safe } = user;
    res.status(201).json(safe);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Validation', message: 'Vous ne pouvez pas vous supprimer vous-même' });
    }
    const deleted = await db.remove('users', req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Not Found', message: 'Utilisateur introuvable' });
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
