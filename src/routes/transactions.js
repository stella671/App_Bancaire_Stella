import { Router } from 'express';
import * as ctrl from '../controllers/transactionController.js';

const router = Router();

/**
 * @openapi
 * /api/v1/transactions/deposit:
 *   post:
 *     tags: [Transactions]
 *     summary: Effectuer un dépôt
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountId: { type: integer }
 *               amount: { type: number }
 *               description: { type: string }
 *             required: [accountId, amount]
 *     responses:
 *       201: { description: Dépôt effectué }
 *       404: { description: Compte introuvable }
 */
router.post('/deposit', ctrl.deposit);

/**
 * @openapi
 * /api/v1/transactions/withdraw:
 *   post:
 *     tags: [Transactions]
 *     summary: Effectuer un retrait
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               accountId: { type: integer }
 *               amount: { type: number }
 *               description: { type: string }
 *             required: [accountId, amount]
 *     responses:
 *       201: { description: Retrait effectué }
 *       400: { description: Solde insuffisant }
 *       404: { description: Compte introuvable }
 */
router.post('/withdraw', ctrl.withdraw);

/**
 * @openapi
 * /api/v1/transactions/transfer:
 *   post:
 *     tags: [Transactions]
 *     summary: Effectuer un virement
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sourceAccountId: { type: integer }
 *               destinationAccountId: { type: integer }
 *               amount: { type: number }
 *               description: { type: string }
 *             required: [sourceAccountId, destinationAccountId, amount]
 *     responses:
 *       201: { description: Virement effectué }
 *       400: { description: Solde insuffisant }
 *       404: { description: Compte introuvable }
 */
router.post('/transfer', ctrl.transfer);

/**
 * @openapi
 * /api/v1/transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: Lister toutes les transactions
 *     responses:
 *       200: { description: Liste des transactions }
 */
router.get('/', ctrl.getAll);

/**
 * @openapi
 * /api/v1/transactions/account/{accountId}:
 *   get:
 *     tags: [Transactions]
 *     summary: Historique des transactions d'un compte
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Historique des transactions }
 *       404: { description: Compte introuvable }
 */
router.get('/account/:accountId', ctrl.getHistory);

/**
 * @openapi
 * /api/v1/transactions/archived:
 *   get:
 *     tags: [Transactions]
 *     summary: Transactions archivées (comptes supprimés)
 *     responses:
 *       200: { description: Liste des transactions archivées }
 */
router.get('/archived', ctrl.getArchived);

export default router;
