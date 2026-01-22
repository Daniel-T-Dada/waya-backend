import { Router } from 'express';
import {
    getChildDashboard,
    getChildChores,
    getChildWallet,
    getChildGoals,
    getChildEarnings,
    getChildDashboardStatsController,
    getChildEarningMeterController,
    getChildEarningsChartController,
    getChildExpenseBreakdownController,
    getRedeemableRewardsController
} from '../controllers/childDashboardController';
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

/**
 * @swagger
 * /child/{childId}/dashboard:
 *   get:
 *     summary: Get child dashboard stats (level, earnings, streak)
 *     description: Returns comprehensive dashboard statistics including level progress, total earnings with percentage change, completed chores count, current streak, and pending chores
 *     tags: [Child Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *         description: Child ID
 *     responses:
 *       200:
 *         description: Dashboard stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 level:
 *                   type: number
 *                 levelProgress:
 *                   type: object
 *                   properties:
 *                     current:
 *                       type: number
 *                     required:
 *                       type: number
 *                     percentage:
 *                       type: number
 *                 totalEarnings:
 *                   type: number
 *                 earningsChange:
 *                   type: number
 *                 completedChores:
 *                   type: number
 *                 currentStreak:
 *                   type: number
 *                 pendingChores:
 *                   type: number
 */
router.get('/:childId/dashboard', requireAuth, getChildDashboardStatsController);

/**
 * @swagger
 * /child/{childId}/earning-meter:
 *   get:
 *     summary: Get child earning meter stats
 *     description: Returns total earned, saved, and spent amounts with percentage changes
 *     tags: [Child Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Earning meter stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEarned:
 *                   type: number
 *                 earnedChange:
 *                   type: number
 *                 totalSaved:
 *                   type: number
 *                 savedChange:
 *                   type: number
 *                 totalSpent:
 *                   type: number
 *                 spentChange:
 *                   type: number
 */
router.get('/:childId/earning-meter', requireAuth, getChildEarningMeterController);

/**
 * @swagger
 * /child/{childId}/earnings-chart:
 *   get:
 *     summary: Get child earnings chart data
 *     description: Returns time series data of earnings and spending for the specified period
 *     tags: [Child Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7days, 30days]
 *           default: 7days
 *     responses:
 *       200:
 *         description: Earnings chart data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       date:
 *                         type: string
 *                       earned:
 *                         type: number
 *                       spent:
 *                         type: number
 */
router.get('/:childId/earnings-chart', requireAuth, getChildEarningsChartController);

/**
 * @swagger
 * /child/{childId}/expense-breakdown:
 *   get:
 *     summary: Get child expense breakdown
 *     description: Returns breakdown of saved vs spent amounts with savings rate
 *     tags: [Child Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7days, 30days]
 *           default: 7days
 *     responses:
 *       200:
 *         description: Expense breakdown retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 saved:
 *                   type: number
 *                 spent:
 *                   type: number
 *                 total:
 *                   type: number
 *                 savingsRate:
 *                   type: number
 */
router.get('/:childId/expense-breakdown', requireAuth, getChildExpenseBreakdownController);

/**
 * @swagger
 * /child/{childId}/redeemable-rewards:
 *   get:
 *     summary: Get redeemable rewards (chores awaiting approval)
 *     description: Returns list of completed chores awaiting parent approval
 *     tags: [Child Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Redeemable rewards retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   choreId:
 *                     type: string
 *                   title:
 *                     type: string
 *                   description:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   status:
 *                     type: string
 *                   completedAt:
 *                     type: string
 */
router.get('/:childId/redeemable-rewards', requireAuth, getRedeemableRewardsController);

export default router;
