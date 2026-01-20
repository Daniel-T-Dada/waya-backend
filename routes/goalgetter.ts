import { Router } from 'express';
import * as goalController from '../controllers/goalController';
import { requireAuth, requireChild } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: GoalGetter
 *   description: Child goal management
 */

/**
 * @swagger
 * /goalgetter/goals:
 *   get:
 *     summary: List child goals
 *     tags: [GoalGetter]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of goals
 */
router.get('/goals', requireAuth, requireChild, goalController.listGoals);

/**
 * @swagger
 * /goalgetter/goals:
 *   post:
 *     summary: Create a new goal
 *     tags: [GoalGetter]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - target_amount
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               target_amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Goal created
 */
router.post('/goals', requireAuth, requireChild, goalController.createGoal);

/**
 * @swagger
 * /goalgetter/goals/{goal_id}/save:
 *   post:
 *     summary: Add savings to a goal
 *     tags: [GoalGetter]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: goal_id
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
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Savings added
 */
router.post('/goals/:goal_id/save', requireAuth, requireChild, goalController.addSavings);

/**
 * @swagger
 * /goalgetter/progress:
 *   get:
 *     summary: Get overall goal progress
 *     tags: [GoalGetter]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Progress statistics
 */
router.get('/progress', requireAuth, requireChild, goalController.getProgress);

/**
 * @swagger
 * /goalgetter/leaderboard:
 *   get:
 *     summary: Get GoalGetter leaderboard
 *     tags: [GoalGetter]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rankings of children
 */
router.get('/leaderboard', requireAuth, goalController.getLeaderboard);

/**
 * @swagger
 * /goalgetter/rewards:
 *   get:
 *     summary: List goal rewards
 *     tags: [GoalGetter]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of rewards earned
 */
router.get('/rewards', requireAuth, requireChild, goalController.getRewards);

export default router;
