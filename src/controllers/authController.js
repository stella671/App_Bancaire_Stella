import * as authService from '../services/authService.js';

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Validation', message: 'username et password requis' });
    }

    const result = await authService.login(username, password);
    if (!result) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Identifiants invalides' });
    }

    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function register(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Validation', message: 'username et password requis' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'Validation', message: 'Le mot de passe doit contenir au moins 4 caractères' });
    }

    const result = await authService.register(username, password);
    if (!result) {
      return res.status(409).json({ error: 'Conflict', message: 'Ce nom d\'utilisateur existe déjà' });
    }

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}
