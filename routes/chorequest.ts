import { Router } from 'express';
import * as choreQuestController from '../controllers/choreQuestController';
import { requireAuth, requireChild } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: ChoreQuest
 *   description: Child chore interface
 */

/**
 * @swagger
 * /chorequest/chores:
 *   get:
 *     summary: List child's chores
 *     tags: [ChoreQuest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of chores assigned to child
 */
router.get('/chores', requireAuth, requireChild, choreQuestController.listChildChores);

/**
 * @swagger
 * /chorequest/chores/{id}/status:
 *   patch:
 *     summary: Mark chore as completed (child)
 *     tags: [ChoreQuest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [completed]
 *     responses:
 *       200:
 *         description: Chore marked as completed
 */
router.patch('/chores/:id/status', requireAuth, requireChild, choreQuestController.updateChoreStatus);

/**
 * @swagger
 * /chorequest/chores/{id}/redeem:
 *   patch:
 *     summary: Redeem chore reward
 *     tags: [ChoreQuest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reward redeemed successfully
 */
router.patch('/chores/:id/redeem', requireAuth, requireChild, choreQuestController.redeemReward);

export default router;
