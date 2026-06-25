import * as authService from '../services/authService.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Token manquant' });
  }

  const token = header.split(' ')[1];
  const payload = authService.verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Token invalide ou expiré' });
  }

  req.user = payload;
  next();
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden', message: 'Accès réservé aux administrateurs' });
  }
  next();
}
