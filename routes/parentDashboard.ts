import { Router } from 'express';
import { getParentDashboard, getParentTaskMaster, getParentWallet, getParentInsights, getParentSettings } from '../controllers/parentDashboardController';
import { requireAuth, requireParent } from '../middlewares/authMiddleware';
import { cacheMiddleware } from '../middlewares/cache';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Parent Dashboard
 *   description: Aggregated endpoints for parent dashboards (reduces API calls)
 */

/**
 * @swagger
 * /parent/dashboard:
 *   get:
 *     summary: Get aggregated parent dashboard data
 *     description: Returns user info, children, tasks summary, wallet balance, and notifications in a single request
 *     tags: [Parent Dashboard]
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
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                     role:
 *                       type: string
 *                       example: parent
 *                 children:
 *                   type: array
 *                   items:
 *                     type: object
 *                 tasksSummary:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     pending:
 *                       type: number
 *                     completed:
 *                       type: number
 *                     overdue:
 *                       type: number
 *                 wallet:
 *                   type: object
 *                 notifications:
 *                   type: array
 *                 quickStats:
 *                   type: object
 *       401:
 *         description: Unauthorized - Not authenticated
 *       403:
 *         description: Forbidden - Not a parent account
 */
router.get('/dashboard', requireAuth, requireParent, cacheMiddleware(300), getParentDashboard);

/**
 * @swagger
 * /parent/taskmaster:
 *   get:
 *     summary: Get aggregated taskmaster data for parent
 *     description: Returns task statistics, completed tasks, pending tasks, and children in a single request
 *     tags: [Parent Dashboard]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: TaskMaster data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 taskStats:
 *                   type: object
 *                   properties:
 *                     totalAssigned:
 *                       type: number
 *                     completed:
 *                       type: number
 *                     pending:
 *                       type: number
 *                     overdue:
 *                       type: number
 *                 completedTasks:
 *                   type: array
 *                 pendingTasks:
 *                   type: array
 *                 children:
 *                   type: array
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a parent account
 */
router.get('/taskmaster', requireAuth, requireParent, cacheMiddleware(180), getParentTaskMaster);

/**
 * @swagger
 * /parent/wallet:
 *   get:
 *     summary: Get aggregated wallet data for parent
 *     description: Returns wallet balance, transactions, children allowances, and spending insights in a single request
 *     tags: [Parent Dashboard]
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
 *                   properties:
 *                     total:
 *                       type: number
 *                     currency:
 *                       type: string
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *                 transactions:
 *                   type: object
 *                   properties:
 *                     income:
 *                       type: array
 *                     expenses:
 *                       type: array
 *                     pagination:
 *                       type: object
 *                 children:
 *                   type: array
 *                 insights:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a parent account
 */
router.get('/wallet', requireAuth, requireParent, cacheMiddleware(120), getParentWallet);

/**
 * @swagger
 * /parent/insights:
 *   get:
 *     summary: Get aggregated insights data for parent
 *     description: Returns task trends, spending patterns, and children performance in a single request
 *     tags: [Parent Dashboard]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Insights data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a parent account
 */
router.get('/insights', requireAuth, requireParent, cacheMiddleware(600), getParentInsights);

/**
 * @swagger
 * /parent/settings:
 *   get:
 *     summary: Get aggregated settings data for parent
 *     description: Returns profile, notifications, privacy settings, and children in a single request
 *     tags: [Parent Dashboard]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Settings data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a parent account
 */
router.get('/settings', requireAuth, requireParent, cacheMiddleware(300), getParentSettings);

export default router;
