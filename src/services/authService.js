import jwt from 'jsonwebtoken';
import * as db from '../db.js';

const SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function login(username, password) {
  const users = await db.findAll('users');
  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) return null;

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    SECRET,
    { expiresIn: '24h' }
  );

  return { token, user: { id: user.id, username: user.username, role: user.role } };
}

export async function register(username, password) {
  const users = await db.findAll('users');
  const existing = users.find((u) => u.username === username);
  if (existing) return null;

  const user = await db.insert('users', { username, password, role: 'user' });
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    SECRET,
    { expiresIn: '24h' }
  );

  return { token, user: { id: user.id, username: user.username, role: user.role } };
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}
