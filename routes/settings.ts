import { Router } from 'express';
import * as settingsController from '../controllers/settingsController';
import { requireAuth, requireParent } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Settings
 *   description: User profile and notification settings
 */

/**
 * @swagger
 * /settings_waya/profile:
 *   get:
 *     summary: Get user profile settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile settings data
 */
router.get('/profile', requireAuth, settingsController.getProfile);

/**
 * @swagger
 * /settings_waya/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/profile', requireAuth, settingsController.updateProfile);

/**
 * @swagger
 * /settings_waya/notification-settings:
 *   get:
 *     summary: Get notification settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification preferences
 */
router.get('/notification-settings', requireAuth, settingsController.getNotificationSettings);

/**
 * @swagger
 * /settings_waya/notification-settings:
 *   put:
 *     summary: Update notification settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email_notifications:
 *                 type: boolean
 *               push_notifications:
 *                 type: boolean
 *               chore_completion_alerts:
 *                 type: boolean
 *               allowance_reminders:
 *                 type: boolean
 *               goal_milestone_alerts:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Notification settings updated
 */
router.put('/notification-settings', requireAuth, settingsController.updateNotificationSettings);

export default router;
