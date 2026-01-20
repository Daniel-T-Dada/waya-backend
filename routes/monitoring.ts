import { Router } from 'express';
import { getPerformanceMetrics, healthCheck } from '../controllers/monitoringController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Monitoring
 *   description: Performance monitoring and health check endpoints
 */

/**
 * @swagger
 * /monitoring/metrics:
 *   get:
 *     summary: Get performance metrics
 *     description: Returns server performance metrics including memory, database stats, and cache status
 *     tags: [Monitoring]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Metrics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/metrics', requireAuth, getPerformanceMetrics);

/**
 * @swagger
 * /monitoring/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns health status of database, Redis, and server
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: System is healthy
 *       503:
 *         description: System is unhealthy
 */
router.get('/health', healthCheck);

export default router;
