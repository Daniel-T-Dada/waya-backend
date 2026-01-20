import { Router } from 'express';
import { getChildDashboard, getChildChores, getChildWallet, getChildGoals, getChildEarnings } from '../controllers/childDashboardController';
import { requireAuth, requireChild } from '../middlewares/authMiddleware';
import { cacheMiddleware } from '../middlewares/cache';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Child Dashboard
 *   description: Aggregated endpoints for child dashboards (reduces API calls)
 */

/**
 * @swagger
 * /child/dashboard:
 *   get:
 *     summary: Get aggregated child dashboard data
 *     description: Returns child info, tasks summary, wallet balance, achievements, goals, and notifications in a single request
 *     tags: [Child Dashboard]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 child:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     username:
 *                       type: string
 *                     name:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                     parentId:
 *                       type: string
 *                 tasksSummary:
 *                   type: object
 *                 wallet:
 *                   type: object
 *                 achievements:
 *                   type: array
 *                 goals:
 *                   type: object
 *                 notifications:
 *                   type: array
 *       401:
 *         description: Unauthorized - Not authenticated
 *       403:
 *         description: Forbidden - Not a child account
 */
router.get('/dashboard', requireAuth, requireChild, cacheMiddleware(300), getChildDashboard);

/**
 * @swagger
 * /child/chores:
 *   get:
 *     summary: Get aggregated chores data for child
 *     description: Returns pending tasks, completed tasks, and statistics in a single request
 *     tags: [Child Dashboard]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Chores data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 child:
 *                   type: object
 *                 pendingTasks:
 *                   type: array
 *                 completedTasks:
 *                   type: array
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalCompleted:
 *                       type: number
 *                     totalEarned:
 *                       type: number
 *                     completionRate:
 *                       type: number
 *                     streak:
 *                       type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a child account
 */
router.get('/chores', requireAuth, requireChild, cacheMiddleware(180), getChildChores);

/**
 * @swagger
 * /child/wallet:
 *   get:
 *     summary: Get aggregated wallet data for child
 *     description: Returns wallet balance, transactions, stats, and financial lessons in a single request
 *     tags: [Child Dashboard]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Wallet data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: object
 *                 transactions:
 *                   type: object
 *                 stats:
 *                   type: object
 *                 financialLessons:
 *                   type: object
 *                 achievements:
 *                   type: array
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a child account
 */
router.get('/wallet', requireAuth, requireChild, cacheMiddleware(120), getChildWallet);

/**
 * @swagger
 * /child/goals:
 *   get:
 *     summary: Get aggregated goals data for child
 *     description: Returns active goals, completed goals, achievements, and recommendations in a single request
 *     tags: [Child Dashboard]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Goals data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a child account
 */
router.get('/goals', requireAuth, requireChild, cacheMiddleware(600), getChildGoals);

/**
 * @swagger
 * /child/earnings:
 *   get:
 *     summary: Get aggregated earnings data for child
 *     description: Returns earnings stats, history, top tasks, and trends in a single request
 *     tags: [Child Dashboard]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Earnings data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a child account
 */
router.get('/earnings', requireAuth, requireChild, cacheMiddleware(300), getChildEarnings);

export default router;
