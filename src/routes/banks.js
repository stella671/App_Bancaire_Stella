import { Router } from 'express';
import * as ctrl from '../controllers/bankController.js';

const router = Router();

/**
 * @openapi
 * /api/v1/banks:
 *   post:
 *     tags: [Banques]
 *     summary: Créer une banque
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               code: { type: string }
 *               address: { type: string }
 *               country: { type: string }
 *             required: [name, code]
 *     responses:
 *       201: { description: Banque créée }
 *       409: { description: Code ou nom déjà existant }
 */
router.post('/', ctrl.create);

/**
 * @openapi
 * /api/v1/banks:
 *   get:
 *     tags: [Banques]
 *     summary: Lister toutes les banques
 *     responses:
 *       200: { description: Liste des banques }
 */
router.get('/', ctrl.getAll);

/**
 * @openapi
 * /api/v1/banks/{id}:
 *   get:
 *     tags: [Banques]
 *     summary: Obtenir une banque par ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Banque trouvée }
 *       404: { description: Banque introuvable }
 */
router.get('/:id', ctrl.getById);

export default router;
