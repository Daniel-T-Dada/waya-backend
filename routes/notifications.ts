import { Router } from 'express';
import * as notificationController from '../controllers/notificationController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User and Child notification management
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: List notifications for the authenticated user (Parent or Child)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/', requireAuth, notificationController.listNotifications);

/**
 * @swagger
 * /notifications/mark-all-read:
 *   post:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.post('/mark-all-read', requireAuth, notificationController.markAllRead);

/**
 * @swagger
 * /notifications/{id}/read:
 *   post:
 *     summary: Mark a single notification as read
 *     tags: [Notifications]
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
 *         description: Notification marked as read
 */
router.post('/:id/read', requireAuth, notificationController.markRead);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Notification deleted
 */
router.delete('/:id', requireAuth, notificationController.removeNotification);

/**
 * @swagger
 * /notifications/clear-all:
 *   delete:
 *     summary: Clear all notifications
 *     description: Delete all notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications cleared
 */
router.delete('/clear-all', requireAuth, notificationController.clearAll);

export default router;

