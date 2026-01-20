import { Router } from 'express';
import * as insightController from '../controllers/insightController';
import { requireAuth, requireParent } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: InsightTracker
 *   description: Analytics and performance tracking for family activities
 */

/**
 * @swagger
 * /insighttracker/chores/insights:
 *   get:
 *     summary: Get detailed chore completion analytics
 *     tags: [InsightTracker]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chore insights data
 */
router.get('/chores/insights', requireAuth, requireParent, insightController.getChoreInsights);

/**
 * @swagger
 * /insighttracker/recent-activities:
 *   get:
 *     summary: Get unified activity feed for the family
 *     tags: [InsightTracker]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of recent activities
 */
router.get('/recent-activities', requireAuth, requireParent, insightController.getRecentActivities);

export default router;
