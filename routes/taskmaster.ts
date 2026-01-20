import { Router } from 'express';
import * as choreController from '../controllers/choreController';
import { requireAuth, requireParent } from '../middlewares/authMiddleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Taskmaster
 *   description: Parent chore management
 */

/**
 * @swagger
 * /taskmaster/chores/create:
 *   post:
 *     summary: Create a new chore
 *     tags: [Taskmaster]
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
 *               - assigned_to
 *               - reward
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               assigned_to:
 *                 type: string
 *               reward:
 *                 type: number
 *               due_date:
 *                 type: string
 *                 format: date
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Chore created successfully
 */
router.post('/chores/create', requireAuth, requireParent, choreController.createChore);

/**
 * @swagger
 * /taskmaster/chores:
 *   get:
 *     summary: List all chores
 *     tags: [Taskmaster]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: assignedTo
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of chores
 */
router.get('/chores', requireAuth, requireParent, choreController.listChores);

/**
 * @swagger
 * /taskmaster/chores/summary:
 *   get:
 *     summary: Get chore summary
 *     tags: [Taskmaster]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chore statistics
 */
router.get('/chores/summary', requireAuth, requireParent, choreController.getChoreSummary);

/**
 * @swagger
 * /taskmaster/chores/{id}:
 *   get:
 *     summary: Get chore details
 *     tags: [Taskmaster]
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
 *         description: Chore details
 */
router.get('/chores/:id', requireAuth, requireParent, choreController.getChore);

/**
 * @swagger
 * /taskmaster/chores/{id}:
 *   put:
 *     summary: Update chore
 *     tags: [Taskmaster]
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
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               reward:
 *                 type: number
 *               due_date:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Chore updated
 */
router.put('/chores/:id', requireAuth, requireParent, choreController.updateChore);

/**
 * @swagger
 * /taskmaster/chores/{id}/delete:
 *   delete:
 *     summary: Delete chore
 *     tags: [Taskmaster]
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
 *         description: Chore deleted
 */
router.delete('/chores/:id/delete', requireAuth, requireParent, choreController.deleteChore);

/**
 * @swagger
 * /taskmaster/chores/{id}/status:
 *   patch:
 *     summary: Update chore status
 *     tags: [Taskmaster]
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
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/chores/:id/status', requireAuth, requireParent, choreController.updateChoreStatus);

export default router;
