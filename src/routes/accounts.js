import { Router } from 'express';
import * as ctrl from '../controllers/accountController.js';

const router = Router();

/**
 * @openapi
 * /api/v1/accounts:
 *   post:
 *     tags: [Comptes]
 *     summary: Créer un compte bancaire
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ownerName: { type: string }
 *               ownerEmail: { type: string }
 *               accountType: { type: string, enum: [CHECKING, SAVINGS, BUSINESS] }
 *               bankId: { type: integer }
 *             required: [ownerName, ownerEmail, accountType, bankId]
 *     responses:
 *       201: { description: Compte créé }
 *       404: { description: Banque introuvable }
 */
router.post('/', ctrl.create);

/**
 * @openapi
 * /api/v1/accounts:
 *   get:
 *     tags: [Comptes]
 *     summary: Lister tous les comptes
 *     responses:
 *       200: { description: Liste des comptes }
 */
router.get('/', ctrl.getAll);

/**
 * @openapi
 * /api/v1/accounts/{id}:
 *   get:
 *     tags: [Comptes]
 *     summary: Obtenir un compte par ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Compte trouvé }
 *       404: { description: Compte introuvable }
 */
router.get('/:id', ctrl.getById);

/**
 * @openapi
 * /api/v1/accounts/bank/{bankId}:
 *   get:
 *     tags: [Comptes]
 *     summary: Lister les comptes d'une banque
 *     parameters:
 *       - in: path
 *         name: bankId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Comptes de la banque }
 *       404: { description: Banque introuvable }
 */
router.get('/bank/:bankId', ctrl.getByBank);

/**
 * @openapi
 * /api/v1/accounts/{id}:
 *   put:
 *     tags: [Comptes]
 *     summary: Modifier un compte (nom, email, type, statut)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ownerName: { type: string }
 *               ownerEmail: { type: string }
 *               accountType: { type: string }
 *               status: { type: string }
 *     responses:
 *       200: { description: Compte modifié }
 *       404: { description: Compte introuvable }
 */
router.put('/:id', ctrl.update);

/**
 * @openapi
 * /api/v1/accounts/{id}:
 *   delete:
 *     tags: [Comptes]
 *     summary: Supprimer un compte
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       204: { description: Compte supprimé }
 *       404: { description: Compte introuvable }
 */
router.delete('/:id', ctrl.remove);

export default router;
