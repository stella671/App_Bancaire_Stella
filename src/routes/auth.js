import { Router } from 'express';
import * as ctrl from '../controllers/authController.js';

const router = Router();

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Authentification]
 *     summary: Connexion
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *             required: [username, password]
 *     responses:
 *       200: { description: Token JWT + infos utilisateur }
 *       401: { description: Identifiants invalides }
 */
router.post('/login', ctrl.login);

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     tags: [Authentification]
 *     summary: Inscription client
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username: { type: string }
 *               password: { type: string }
 *             required: [username, password]
 *     responses:
 *       201: { description: Token JWT + infos utilisateur }
 *       409: { description: Nom d'utilisateur déjà existant }
 */
router.post('/register', ctrl.register);

export default router;
